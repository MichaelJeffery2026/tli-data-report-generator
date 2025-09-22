import { useEffect, useState } from "react";
import Dropdown from "../components/dropdown";

export default function SurveyDropdown({ value, onChange }) {
    const [surveys, setSurveys] = useState([]);

    useEffect(() => {
        fetch(`/api/surveys`)
            .then((res) => res.json())
            .then((data) =>
                setSurveys(data.map((s) => ({ value: s.id, label: s.name })))
            )
            .catch((err) => console.error("Failed to load surveys:", err));
    }, []);

    return (
        <Dropdown
            options={surveys}
            value={value}
            onChange={onChange}
        />
    );
}