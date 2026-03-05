// src/components/ProblemNotes.jsx
import { useState } from "react";
import api from "../api/axios";
import ReactMarkdown from "react-markdown";
import { Pen, Sparkles } from "lucide-react";
import PropTypes from "prop-types";

ProblemNotes.propTypes = {
  problem: PropTypes.object.isRequired,
};

export default function ProblemNotes({ problem }) {
  const [notes, setNotes] = useState(problem.ai_notes || "");
  const [editing, setEditing] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const runAI = async () => {
    setLoadingAI(true);

    const res = await api.post("ai/analyze-code/", {
      problem_id: problem.id,
      code: problem.code_snippet,
      user_notes: notes, // 👈 IMPORTANT
      links: problem.links,
      title: problem.title,
    });

    setNotes(res.data.notes);
    setLoadingAI(false);
  };

  const saveNotes = async () => {
    await api.patch(`dsa/problems/${problem.id}/`, {
      ai_notes: notes,
    });
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <h5 className="font-medium">📝 Notes</h5>
        <div className="space-x-2">
          <button onClick={() => setEditing(true)}>
            <Pen size={16} />
          </button>
          <button onClick={runAI}>
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-40 p-2 border rounded"
          />
          <button
            onClick={() => {
              saveNotes();
              setEditing(false);
            }}
            className="mt-2 text-sm text-primary"
          >
            Save notes
          </button>
        </>
      ) : (
        <div className="prose text-sm max-w-none">
          <ReactMarkdown>{notes || "_No notes yet_"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
