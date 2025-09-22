import { useEffect, useState } from "react";
import Dropdown from "../components/dropdown";

export default function SectionDropdown({ surveyId, value, onChange }) {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        if (!surveyId) {
            setSections([]);
            return;
        }

        fetch(`/api/surveys/${surveyId}/filters`)
            .then((res) => res.json())
            .then((data) =>
                setSections(data.map((s) => ({ value: s.id, label: s.name })))
            )
            .catch((err) => console.error("Failed to load surveys:", err));
    }, [surveyId]);

    return (
        <Dropdown
            options={sections}
            value={value}
            onChange={onChange}
        />
    );
}