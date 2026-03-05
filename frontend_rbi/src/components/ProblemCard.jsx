// src/components/ProblemCard.jsx
import CodeEditor from "./ProblemCode";
import NotesPanel from "./ProblemNotes";
import PropTypes from "prop-types";

export default function ProblemCard({ problem }) {
  return (
    <div className="bg-surface p-4 rounded-lg shadow-sm">
      <h4 className="font-medium">{problem.title}</h4>

      {/* Links */}
      <div className="text-sm mt-2">
        {problem.links.map((l) => (
          <a key={l.id} href={l.url} className="text-primary mr-3">
            🔗 {l.title || "Link"}
          </a>
        ))}
      </div>

      {/* Code + Notes */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <CodeEditor problem={problem} />
        <NotesPanel problem={problem} />
      </div>
    </div>
  );
}
ProblemCard.propTypes = {
  problem: PropTypes.object.isRequired,
};
