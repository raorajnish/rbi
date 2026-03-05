// src/components/ProblemCode.jsx
import { useState } from "react";
import api from "../api/axios";
import PropTypes from "prop-types";

ProblemCode.propTypes = {
  problem: PropTypes.object.isRequired,
};

export default function ProblemCode({ problem }) {
  const [code, setCode] = useState(problem.code_snippet);

  const saveCode = async () => {
    await api.patch(`dsa/problems/${problem.id}/`, {
      code_snippet: code,
    });
  };

  return (
    <div>
      <h5 className="font-medium mb-2">💻 Code</h5>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-40 p-2 border rounded"
      />
      <button onClick={saveCode} className="mt-2 text-sm text-primary">
        Save code
      </button>
    </div>
  );
}
