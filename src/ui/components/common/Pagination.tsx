import { Box, Button, Typography } from "@mui/material";

const Pagination = ({ currentPage, totalPages, onChange }) => (
  <Box display="flex" gap={1} justifyContent="center" alignItems="center" mt={2}>
    <Button disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)}>
      Prev
    </Button>
    <Typography>
      Page {currentPage} of {totalPages}
    </Typography>
    <Button disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)}>
      Next
    </Button>
  </Box>
);

export default Pagination;
