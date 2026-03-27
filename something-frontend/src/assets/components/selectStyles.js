export const customSelect = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "transparent",
    border: "2px solid rgba(255, 255, 255, 0.68)",
    borderRadius: "12px",
    padding: "4px",
    transition: "all 0.2s ease",
    minHeight: "10px",
    fontSize: "16px",
    boxShadow: "none",
    width:"40%",
    height:"50px",

    "&:hover": {
      border: "2px solid rgba(255,255,255,0.6)",
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#1e2a3a",
    borderRadius: "12px",
    overflow: "hidden",
    fontSize: "16px",
    border: "1px solid rgba(255,255,255,0.1)"
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#4a5568"
      : state.isFocused
      ? "#2d3748"
      : "transparent",
    color: "#ffffff",
    cursor: "pointer",
    padding: "10px",
  }),
  groupHeading: (provided) => ({
    ...provided,
    color: "#a0aec0",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "8px 12px 4px"
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#4a5568",
    borderRadius: "8px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#ffffff"
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#ffffff",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#ffffff",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "rgba(0, 0, 0, 0.8)"
  }),
  input: (provided) => ({
    ...provided,
    color: "#ffffff"
  }),
  valueContainer: (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center"
  })
};