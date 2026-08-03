"use client";

import { useState, type ReactNode } from "react";
import { BookOpen } from "lucide-react";

type ClassroomOption = {
  id: string;
  name: string;
  ageGroup: string | null;
  defaultStart: string;
  defaultEnd: string;
  content: ReactNode;
};

export function ClassroomSwitcher({
  classrooms,
  initialClassroomId,
  classroomForm,
}: {
  classrooms: ClassroomOption[];
  initialClassroomId?: string;
  classroomForm: ReactNode;
}) {
  const fallbackId = classrooms[0]?.id;
  const [selectedId, setSelectedId] = useState(
    classrooms.some((classroom) => classroom.id === initialClassroomId)
      ? initialClassroomId
      : fallbackId,
  );
  const selected =
    classrooms.find((classroom) => classroom.id === selectedId) ?? classrooms[0];

  function selectClassroom(classroomId: string) {
    setSelectedId(classroomId);
    const url = new URL(window.location.href);
    url.searchParams.set("classroom", classroomId);
    url.searchParams.delete("success");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <>
      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        {classroomForm}
        <div className="rounded-2xl border border-[#dce6f2] bg-white p-5">
          <strong className="flex items-center gap-2 text-sm">
            <BookOpen size={17} /> Turmas ativas
          </strong>
          <div className="mt-4 grid gap-2">
            {classrooms.map((classroom) => {
              const isSelected = selected?.id === classroom.id;
              return (
                <button
                  key={classroom.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectClassroom(classroom.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                    isSelected
                      ? "border-[#0759bd] bg-[#edf5fd]"
                      : "border-[#e3eaf2] hover:border-[#b1c2d4] hover:bg-[#fbfdff]"
                  }`}
                >
                  <span>
                    <strong className="block">{classroom.name}</strong>
                    <small className="text-[#6f8299]">{classroom.ageGroup}</small>
                  </span>
                  <span>
                    {classroom.defaultStart.slice(0, 5)}–
                    {classroom.defaultEnd.slice(0, 5)}
                  </span>
                </button>
              );
            })}
          </div>
          {selected ? (
            <p aria-live="polite" className="mt-3 text-[11px] text-[#386b9f]">
              Editando agora: <strong>{selected.name}</strong>
            </p>
          ) : null}
        </div>
      </section>
      {selected?.content}
    </>
  );
}
