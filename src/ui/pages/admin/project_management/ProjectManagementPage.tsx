import React, { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";

const ProjectManagementContent = lazy(() => import("./ProjectManagementContent"));

const ProjectManagementPage = ({ mode = "light" }: any) => {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <ProjectManagementContent mode={mode} />
    </Suspense>
  );
};

export default ProjectManagementPage;
