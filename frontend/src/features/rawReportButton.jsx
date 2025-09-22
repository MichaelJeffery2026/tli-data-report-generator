import Button from "../components/button";

export default function RawReportButton({ surveyId, sectionId }) {
    const onClick = () => {
        if (!surveyId || !sectionId) {
            console.warn("Missing surveyId or sectionId");
            return;
        }
        window.location.href = `/api/reports/raw/${surveyId}/${sectionId}`;
    };
    return (
        <Button
            label="Create Raw Report"
            onClick={onClick}
        />
    );
}