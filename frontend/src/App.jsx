import { useState } from "react";
import SurveyDropdown from "./features/surveyDropdown.jsx"
import SectionDropdown from "./features/sectionDropdown.jsx";
import RawReportButton from "./features/rawReportButton.jsx";
import TextEntry from "./components/textEntry.jsx";

function App() {
  const [surveyId, setSurveyId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [assignments, setAssignments] = useState("");
  const [thirdParty, setThirdParty] = useState("");
  const [learningMaterials, setLearningMaterials] = useState("");
  const [cohortActivities, setCohortActivities] = useState("");
  
  return (
    <>
      <SurveyDropdown
        value={surveyId}
        onChange={(e) => {
          setSurveyId(e.target.value);
          setSectionId("");
        }}
      />

      <SectionDropdown
        surveyId={surveyId}
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
      />

      <RawReportButton 
        surveyId={surveyId}
        sectionId={sectionId}
      />

      <TextEntry
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />

      <TextEntry
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter your job title"
      />

      <TextEntry
        value={professor}
        onChange={(e) => setProfessor(e.target.value)}
        placeholder="Enter the professor of the course"
      />

      <TextEntry
        value={assignments}
        onChange={(e) => setAssignments(e.target.value)}
        placeholder="List the types of assignments like discussions, group projects, quizzes, papers, etc."
      />

      <TextEntry
        value={thirdParty}
        onChange={(e) => setThirdParty(e.target.value)}
        placeholder="List third party tools like Cengage textbooks and assignments, Perusall assignments, Packback discussions, etc."
      />

      <TextEntry
        value={learningMaterials}
        onChange={(e) => setLearningMaterials(e.target.value)}
        placeholder="List learning materials like textbooks, articles, Rise interactive lessons, etc."
      />

      <TextEntry
        value={cohortActivities}
        onChange={(e) => setCohortActivities(e.target.value)}
        placeholder="List examples of the activities in the cohort sessions and graded assignments."
      />
    </>
  )
}

export default App
