import React from "react";
import { Typography } from "@mui/material";
import CategoryClientPage from "./CategoryClientPage";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

async function fetchCategoryData(id) {
  const cookieStore = (await cookies()).toString();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/budget-categories/${id}`;

  try {
    const res = await fetch(apiUrl, { cache: "no-store", headers: { cookie: cookieStore } });
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
  const { id } = await params;


  if (!id) {
    return <Typography>Error: Invalid category ID</Typography>;
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return <Typography>Error: Not authenticated</Typography>;
  }

  const categoryData = await fetchCategoryData(id);

  return <CategoryClientPage categoryData={categoryData} />;
}
