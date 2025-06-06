"use client";

import React, { useEffect, useState } from "react";


export default function DashboardPage() {  
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);      
      setLoading(false);
    }
    fetchData();
  },);    
    

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-all">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Total de funcionários</span>
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{loading}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Presentes Hoje</span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">{loading}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Ausentes Hoje</span>
          <span className="text-3xl font-bold text-red-600 dark:text-red-400">{loading}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Atrasos Hoje</span>
          <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400"> </span>
        </div>
      </div>
    </div>
  );
}