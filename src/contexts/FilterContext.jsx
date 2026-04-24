import React, { createContext, useContext, useState } from "react";

const FilterContext = createContext(null);

const DEFAULT_FILTERS = {
  radius: 25,
  date: "",
  time: "",
  categories: [],
};

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  return useContext(FilterContext);
}
