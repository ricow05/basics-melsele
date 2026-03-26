// Rules used to generate team names and metadata when creating new teams.
const TEAM_CREATE_RULES = {
  seniors: {
    category: "seniors",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `HSE ${toAlphabeticSuffix(count)}`,
      V: (count) => `DSE ${toAlphabeticSuffix(count)}`,
    },
  },
  U19: {
    category: "jeugd",
    genders: ["V"],
    nameForGender: {
      V: (count) => (count === 0 ? "U19 M" : `U19 M ${toAlphabeticSuffix(count)}`),
    },
  },
  U18: {
    category: "jeugd",
    genders: ["M"],
    nameForGender: {
      M: (count) => `U18 ${toAlphabeticSuffix(count)}`,
    },
  },
  U16: {
    category: "jeugd",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `U16 ${toAlphabeticSuffix(count)}`,
      V: (count) => `U16 M ${toAlphabeticSuffix(count)}`,
    },
  },
  U14: {
    category: "jeugd",
    genders: ["M", "V"],
    nameForGender: {
      M: (count) => `U14 ${toAlphabeticSuffix(count)}`,
      V: (count) => `U14 M ${toAlphabeticSuffix(count)}`,
    },
  },
  U12: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U12 ${toAlphabeticSuffix(count)}`,
    },
  },
  U10: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U10 ${toAlphabeticSuffix(count)}`,
    },
  },
  U8: {
    category: "jeugd",
    genders: [""],
    nameForGender: {
      "": (count) => `U8 ${toAlphabeticSuffix(count)}`,
    },
  },
  basketschool: {
    category: "jeugd",
    genders: [""],
    maxTeams: 1,
    nameForGender: {
      "": () => "basketschool",
    },
  },
};

function toAlphabeticSuffix(index) {
  let value = index;
  let result = "";

  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return result;
}

export function normalizeGender(value) {
  return value === "" || value == null ? null : value;
}

export function filterTeamsForRule(teams, ageCategory, gender) {
  return teams.filter((team) => {
    if (team.age_category !== ageCategory) return false;
    if (normalizeGender(gender) === null) return true;
    return normalizeGender(team.gender) === normalizeGender(gender);
  });
}

export function getRuleForAgeCategory(ageCategory) {
  return TEAM_CREATE_RULES[ageCategory] || null;
}

export function getCreatableAgeCategories() {
  return Object.keys(TEAM_CREATE_RULES);
}

export { TEAM_CREATE_RULES };