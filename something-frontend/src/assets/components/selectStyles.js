// export const customSelect = {
//   control: (provided) => ({
//     ...provided,
//     backgroundColor: "transparent",
//     border: "2px solid rgba(255, 255, 255, 0.68)",
//     borderRadius: "12px",
//     padding: "4px",
//     transition: "all 0.2s ease",
//     minHeight: "10px",
//     fontSize: "16px",
//     boxShadow: "none",
//     width:"40%",
//     height:"50px",

//     "&:hover": {
//       border: "2px solid rgba(255,255,255,0.6)",
//     }
//   }),
//   menu: (provided) => ({
//     ...provided,
//     backgroundColor: "#1e2a3a",
//     borderRadius: "12px",
//     overflow: "hidden",
//     fontSize: "16px",
//     border: "1px solid rgba(255,255,255,0.1)"
//   }),
//   option: (provided, state) => ({
//     ...provided,
//     backgroundColor: state.isSelected
//       ? "#4a5568"
//       : state.isFocused
//       ? "#2d3748"
//       : "transparent",
//     color: "#ffffff",
//     cursor: "pointer",
//     padding: "10px",
//   }),
//   groupHeading: (provided) => ({
//     ...provided,
//     color: "#a0aec0",
//     fontSize: "11px",
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     letterSpacing: "1px",
//     padding: "8px 12px 4px"
//   }),
//   multiValue: (provided) => ({
//     ...provided,
//     backgroundColor: "#4a5568",
//     borderRadius: "8px",
//   }),
//   multiValueLabel: (provided) => ({
//     ...provided,
//     color: "#ffffff"
//   }),
//   multiValueRemove: (provided) => ({
//     ...provided,
//     color: "#ffffff",
//   }),
//   singleValue: (provided) => ({
//     ...provided,
//     color: "#ffffff",
//   }),
//   placeholder: (provided) => ({
//     ...provided,
//     color: "rgba(0, 0, 0, 0.8)"
//   }),
//   input: (provided) => ({
//     ...provided,
//     color: "#ffffff"
//   }),
//   valueContainer: (provided) => ({
//     ...provided,
//     display: "flex",
//     alignItems: "center"
//   })
// };


 export const customSelect = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
   
    border: "2px solid black", 
    borderRadius: "12px",
    padding: "7px",
    transition: "all 0.2s ease",
      
   minHeight: "10px",
    fontSize: "16px",
    display: "flex",
    alignItems: "center", 
    
  }),valueContainer: (provided) => ({
    ...provided,
    paddingTop: "2px",     
   
    display: "flex",
    alignItems: "center"
  }),

  menu: (provided) => ({
    ...provided,
    backgroundColor: "#ecf1fa",
    borderRadius: "12px",
    overflow: "hidden",
    fontSize: "16px"
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#b3bfe5"
      : state.isFocused
      ? "#6791d5"
      : "#ced7ea",
    color: "#000000",
    cursor: "pointer",
    padding: "10px",
    
  
  }),

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#6476af",
    borderRadius: "8px",
     marginTop: "2px",       
    marginBottom: "2px"
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
    color: "#000000",
    marginTop: "2px",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#1e1e1f"
  }),

  input: (provided) => ({
    ...provided,
    color: "#232326"
  })
};