//this file will have a typical validation functions for forms
//for example, email validation, password strength validation, etc.
//ended up only having those....shame on who ever wrote this code.....wait....not gonna comment....




// NAME VALIDATION

export function isValidFullName(name) {
  if (!name) return false;

  // trim and split by one or more spaces
  const parts = name.trim().split(/\s+/);

  // requirement 1: At least two words (meaning at least one space existed)
  if (parts.length < 2) return false;

  // requirement 2: Every part must have at least 2 letters
  return parts.every(part => part.length >= 2);
}

// AGE VALIDATION

// Rule: minimum age (default = 17)
//never did the max....
export function isOldEnough(dateStr, minAge = 17) {
  if (!dateStr) return false;

  const dob = new Date(dateStr);
  if (isNaN(dob)) return false;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= minAge;
}


// EMAIL VALIDATION
// Rule: basic email pattern
export function isValidEmail(email) {
  if (!email) return false;

  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}


// UNIVERSITY VALIDATION

// Rule:
// - code OR custom name must exist
export function isValidUniversity(university) {
  if (!university) return false;

  const { code, name } = university;

  // predefined university
  if (code && typeof code === "string") return true;

  // custom university
  if (!code && typeof name === "string" && name.trim().length >= 3) {
    return true;
  }

  return false;
}


// ROLE VALIDATION
// Rule: either "student" or "professor"
export function isValidRole(role) {
  return role === "student" || role === "professor";
}


// MAJORS VALIDATION

// Rule:
// - always an array
// - student: exactly 1
// - professor: at least 1
export function isValidMajors(majors, role) {
  if (!Array.isArray(majors)) return false;

  if (role === "student") {
    return majors.length === 1;
  }

  if (role === "professor") {
    return majors.length >= 1;
  }

  return false;
}


//username validation
export const validateUsername = (value, t) => {
    
  const minLength = 5;
  const maxLength = 20;
  const allowedPattern = /^[a-zA-Z0-9_$&\-~]+$/;

  if (!value) {
    return {
      valid: false,
      message: "",
      color: ""
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
       message: t
        ? t("validation.username_too_short", { min: minLength })
        : `Username must be at least ${minLength} characters.`,
      color: "#fc0c0ce9"
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      message: t
        ? t("validation.username_too_long", { max: maxLength })
        : `Username must be no more than ${maxLength} characters.`,
      color: "#fc0c0ce9"
    };
  }

  if (!allowedPattern.test(value)) {
    return {
      valid: false,
      message: t
        ? t("validation.username_invalid_chars")
        : "Only letters, numbers, and $&-~ are allowed.",
      color: "#fc0c0ce9"
    };
  }

  return {
    valid: true,
    message: "Username looks good!",
    color: "#046e12ff"
  };
};





//password strength validation
export const checkPasswordStrength = (value, t) => {
  let strength = 0;
 
  if (value.length >= 8) strength++;
  if (/[a-z]/.test(value)) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[@$&\-~!#%^*+=]/.test(value)) strength++;
 
  const messageKey = `validation.password_strength_${strength}`;
 
  const fallbackMessages = [
    "",
    "Very weak, try harder",
    "Still weak, you can do better",
    "Moderate, almost there",
    "Strong, good job",
    "Very strong, proud of you! :)"
  ];
 
  const colors = [
    "",
    "#fc0c0ce9",
    "#fe6905ff",
    "#983a04ff",
    "#03a794ff",
    "#249733ff"
  ];
 
  return {
    strength,
    message: t ? t(messageKey) : fallbackMessages[strength],
    color: colors[strength]
  };
};
 

// export { validateUsername, checkPasswordStrength };









// PROFILE VALIDATION (AGGREGATE)
// Rule: all profile fields must be valid
//
export function validateProfile(profile, t) {
  const _ = (key) => (t ? t(key) : key); // helper: translate or return key as fallback
 
  if (!profile) return { valid: false, error: _("validation.profile_missing") };
 
  const { fullName, birthDate, email, university, role, majors, profProof } = profile;
 
  if (!isValidFullName(fullName))
    return { valid: false, error: _("validation.profile_invalid_name") };
 
  if (!isOldEnough(birthDate))
    return { valid: false, error: _("validation.profile_underage") };
 
  if (!isValidEmail(email))
    return { valid: false, error: _("validation.profile_invalid_email") };
 
  if (!isValidUniversity(university))
    return { valid: false, error: _("validation.profile_invalid_university") };
 
  if (!isValidRole(role))
    return { valid: false, error: _("validation.profile_invalid_role") };
 
  if (!isValidMajors(majors, role))
    return { valid: false, error: _("validation.profile_invalid_majors") };
 
  if (role === "professor") {
    if (!profProof)
      return { valid: false, error: _("validation.profile_proof_required") };
 
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(profProof.type))
      return { valid: false, error: _("validation.profile_proof_invalid_type") };
 
    if (profProof.size > 7 * 1024 * 1024)
      return { valid: false, error: _("validation.profile_proof_too_large") };
  }
 
  return { valid: true };
}


