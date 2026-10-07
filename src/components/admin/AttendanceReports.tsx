"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Loader2, Download } from "lucide-react";

import {
  getAttendancesAction,
  getUsersAction,
  getSubjectsAction,
} from "@/app/actions/dbActions";

import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

export default function AttendanceReports() {

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    setLoading(true);

    try {

      const [attendances, users, subjects] = await Promise.all([
        getAttendancesAction(),
        getUsersAction(),
        getSubjectsAction(),
      ]);

      const populated = attendances
        .map((att) => {

          const student = users.find((u) => u.id === att.studentId);
          const subject = subjects.find((s) => s.id === att.subjectId);

          return {
            ...att,
            studentName: student?.name || "Unknown",
            subjectName: subject?.name || "Unknown",
            teacherName: subject?.teacherName || "Unknown",
          };

        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecords(populated);

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  /* -----------------------------
     FILTER BY DATE
  ------------------------------ */

  const recordsByDate = selectedDate
    ? records.filter(
        (r) =>
          new Date(r.date).toISOString().split("T")[0] === selectedDate
      )
    : [];

  const filtered = recordsByDate.filter((r) =>
    r.studentName.toLowerCase().includes(search.toLowerCase()) ||
    r.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    r.teacherName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const isValidDate = (date: any) =>
    date && !isNaN(new Date(date).getTime());

  /* -----------------------------
     EXPORT CSV
  ------------------------------ */

  const exportCSV = () => {

    if (!filtered.length) return;

    const rows = filtered.map((rec) => ({
      Student: rec.studentName,
      Subject: rec.subjectName,
      Teacher: rec.teacherName,
      "Time In": new Date(rec.date).toLocaleString(),
      "Time Out": isValidDate(rec.timeOut)
        ? new Date(rec.timeOut).toLocaleString()
        : "-",
      Status: rec.status,
    }));

    const csv =
      Object.keys(rows[0]).join(",") +
      "\n" +
      rows.map((r) => Object.values(r).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;

    a.click();
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h2 className="text-3xl font-bold">Attendance Reports</h2>
        <p className="text-gray-500">
          Select a date to view student lab sessions
        </p>
      </div>

      {/* DATE SELECTOR */}

      <div className="bg-white p-5 rounded-xl shadow border flex flex-col sm:flex-row gap-4 justify-between items-center">

        <div className="flex items-center gap-3">

          <Calendar className="text-primary" />

          <div>
            <p className="text-sm text-gray-500">Select Date</p>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2"
            />

          </div>

        </div>

        {filtered.length > 0 && (

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download size={16} />
            Export CSV
          </button>

        )}

      </div>

      {/* SEARCH */}

      {selectedDate && (

        <input
          type="text"
          placeholder="Search student, subject, teacher..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full border rounded-lg px-4 py-3"
        />

      )}

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow border overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left">Student</th>
                <th className="px-4 py-4 text-left">Subject</th>
                <th className="px-4 py-4 text-left">Teacher</th>
                <th className="px-4 py-4 text-left">Time In</th>
                <th className="px-4 py-4 text-left">Time Out</th>
                <th className="px-4 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td colSpan={6} className="text-center p-10">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {!selectedDate && !loading && (
                <tr>
                  <td colSpan={6} className="text-center p-10 text-gray-500">
                    Please select a date to view attendance
                  </td>
                </tr>
              )}

              {!loading &&
                paginated.map((rec) => (

                  <tr key={rec.id} className="border-t hover:bg-gray-50">

                    <td className="px-4 py-4">{rec.studentName}</td>

                    <td className="px-4 py-4">{rec.subjectName}</td>

                    <td className="px-4 py-4">{rec.teacherName}</td>

                    <td className="px-4 py-4 text-sm">
                      {new Date(rec.date).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {isValidDate(rec.timeOut)
                        ? new Date(rec.timeOut).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-4 py-4">

                      <Badge
                        variant={
                          rec.status === "present"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          rec.status === "present"
                            ? "text-green-800 bg-green-100"
                            : ""
                        }
                      >
                        {rec.status}
                      </Badge>

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* PAGINATION */}

      {totalPages > 1 && (

        <div className="flex justify-between items-center">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>

        </div>

      )}

    </div>
  );
}