export default function Dropdown({ options = [], value, onChange }) {
    return (
        <select value={value} onChange={onChange}>
            <option value="" disabled>-- Select an option --</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}