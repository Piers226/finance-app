import React from "react";
import { Typography } from "@mui/material";
import CategoryClientPage from "./CategoryClientPage";

async function fetchCategoryData(id) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/budget-categories/${id}`;

  try {
    const res = await fetch(apiUrl, { cache: "no-store" }); // Opt-out of caching
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching category data:", error);
    return null;
  }
}

export default async function CategoryPage({ params }) {
  const { id } = params;

  if (!id) {
    return <Typography>Error: Invalid category ID</Typography>;
  }

  const categoryData = await fetchCategoryData(id);

  return <CategoryClientPage categoryData={categoryData} />;
}
