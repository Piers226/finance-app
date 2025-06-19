"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Container } from "@mui/material";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function CategoryPage({ params }) {
  const [categoryData, setCategoryData] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    async function unwrapParams() {
      if (params && typeof params.then === "function") {
        const unwrappedParams = await params;
        setId(unwrappedParams.id);
      } else {
        setId(params?.id || "");
      }
    }

    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (id) {
      async function fetchCategoryData() {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const apiUrl = `${baseUrl}/api/budget-categories/${id}`;
        console.log("Fetching data from API URL:", apiUrl);

        try {
          const res = await fetch(apiUrl);
          if (!res.ok) {
            throw new Error("Failed to fetch data");
          }
          const data = await res.json();
          setCategoryData(data);
        } catch (error) {
          console.error("Error fetching category data:", error);
        }
      }

      fetchCategoryData();
    }
  }, [id]);

  if (!id) {
    return <Typography>Error: Invalid category ID</Typography>;
  }

  if (!categoryData) {
    return <Typography>Loading category data...</Typography>;
  }

  const { name, weeklySpending, monthlySpending, spendingHistory } =
    categoryData;

  // Group transactions by week starting on Monday
  const groupedByWeek = spendingHistory.reduce((acc, tx) => {
    const txDate = new Date(tx.date);
    const weekStart = new Date(
      txDate.setDate(txDate.getDate() - ((txDate.getDay() + 6) % 7))
    );
    const weekKey = weekStart.toLocaleDateString();
    acc[weekKey] = (acc[weekKey] || 0) + tx.amount;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(groupedByWeek),
    datasets: [
      {
        label: "Weekly Spending",
        data: Object.values(groupedByWeek),
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.2)",
      },
    ],
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, px: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 500 }}>
        {name} Spending Overview
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Line data={chartData} />
      </Box>
      <Box
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Average Weekly Spending: ${weeklySpending.toFixed(2)}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Total Monthly Spending: ${monthlySpending.toFixed(2)}
        </Typography>
      </Box>
    </Container>
  );
}
