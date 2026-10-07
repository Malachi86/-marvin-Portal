
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Plus, Trash2, Book, Loader2, Building, Monitor } from 'lucide-react';
import { getRoomsAction, getLabsAction, getSubjectsAction, getReservationsAction, addReservationAction, deleteReservationAction } from '@/app/actions/dbActions';
import { Room, Lab, Subject, Reservation } from '@/utils/storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define a type for combined reservations with populated data
type PopulatedReservation = Reservation & {
    subjectName: string;
    locationName: string;
};

export default function RoomReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<PopulatedReservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
      subjectId: '',
      locationType: 'room' as 'room' | 'lab',
      locationId: '',
      date: '',
      startTime: '',
      endTime: ''
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [res, ro, la, su] = await Promise.all([
            getReservationsAction(),
            getRoomsAction(),
            getLabsAction(),
            getSubjectsAction()
        ]);
        
        const teacherSubjects = su.filter((s: Subject) => s.teacherId === user.id);
        
        const now = new Date();
        const myReservations = res.filter((r: Reservation) => {
            if (r.teacherId !== user.id) return false;
            // Filter out past reservations
            try {
                const reservationEndDateTime = new Date(`${r.date}T${r.endTime}`);
                return reservationEndDateTime > now;
            } catch (e) {
                console.error("Invalid date/time for reservation:", r.id);
                return false;
            }
        });

        const populated = myReservations.map((r: Reservation) => {
            const subject = teacherSubjects.find(s => s.id === r.subjectId);
            const location = r.locationType === 'room' 
                ? ro.find(loc => loc.id === r.locationId)
                : la.find(loc => loc.id === r.locationId);
            return {
                ...r,
                subjectName: subject?.name || 'Unknown Subject',
                locationName: location?.name || 'Unknown Location'
            };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setReservations(populated);
        setRooms(ro);
        setLabs(la);
        setSubjects(teacherSubjects);
    } catch(e) {
        toast.error("Failed to load reservation data.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddReservation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (!formData.subjectId || !formData.locationId || !formData.date || !formData.startTime || !formData.endTime) {
          toast.error("Please fill all fields.");
          return;
      }
      setSaving(true);
      try {
          await addReservationAction({
              teacherId: user.id,
              ...formData
          });
          toast.success("Reservation created successfully!");
          setDialogOpen(false);
          // Reset form
          setFormData({ subjectId: '', locationType: 'room', locationId: '', date: '', startTime: '', endTime: ''});
          loadData();
      } catch (e) {
          toast.error("Failed to create reservation.");
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
    try {
        await deleteReservationAction(id);
        toast.success("Reservation deleted.");
        loadData();
    } catch(e) {
        toast.error("Failed to delete reservation.");
    }
  };
  
  const locations = formData.locationType === 'room' ? rooms : labs;

  return (
    <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
                <h2 className="text-3xl mb-2">Room & Lab Reservations</h2>
                <p className="text-gray-600">Reserve rooms/labs for your subjects</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full md:w-auto bg-[#b40000] text-white hover:bg-[#8b0000]"><Plus className="mr-2 h-4 w-4"/>Add Reservation</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Reservation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddReservation} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectId">Subject</Label>
                            <Select value={formData.subjectId} onValueChange={v => setFormData({...formData, subjectId: v})} required>
                                <SelectTrigger id="subjectId"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Location Type</Label>
                            <RadioGroup defaultValue="room" value={formData.locationType} onValueChange={(v: 'room' | 'lab') => setFormData({...formData, locationType: v, locationId: ''})} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="room" id="r1" />
                                    <Label htmlFor="r1">Room</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lab" id="r2" />
                                    <Label htmlFor="r2">Lab</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                         <div className="space-y-2">
                            <Label htmlFor="locationId">Location</Label>
                            <Select value={formData.locationId} onValueChange={v => setFormData({...formData, locationId: v})} required disabled={!formData.locationType}>
                                <SelectTrigger id="locationId"><SelectValue placeholder={`Select a ${formData.locationType}`} /></SelectTrigger>
                                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input id="startTime" type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input id="endTime" type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required/>
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Create Reservation"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        
        {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : reservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-4">No reservations yet</p>
                <p className="text-gray-400">Click "Add Reservation" to reserve a room or lab</p>
            </div>
        ) : (
            <div className="space-y-4">
                {reservations.map((reservation) => (
                    <div key={reservation.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                            <Book size={24} className="text-[#b40000]" />
                            <h3 className="text-xl">{reservation.subjectName}</h3>
                            </div>
                            
                            <div className="space-y-2 ml-9">
                            <div className="flex items-center gap-2 text-gray-700">
                            {reservation.locationType === 'lab' ? <Monitor size={18} /> : <Building size={18} />}
                                <span className="capitalize">{reservation.locationType}: {reservation.locationName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={18} />
                                <span>{new Date(reservation.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                                })}</span>
                            </div>
                            
                            <p className="text-gray-600">Time: {reservation.startTime} - {reservation.endTime}</p>
                            </div>
                        </div>
                        
                        <Button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-shadow"
                        >
                            <Trash2 size={20} />
                        </Button>
                        </div>
                    </div>
                    ))}
            </div>
        )}
    </div>
  );
}
