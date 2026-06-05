import { Card, CardContent, Typography, Box } from "@mui/material";

const FormCard = ({ title, children, fullWidth = false }) => (
  <Card sx={{ gridColumn: fullWidth ? "1 / -1" : "span 1", mb: 2 }}>
    <CardContent>
      <Typography variant="h6" color="primary" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </CardContent>
  </Card>
);

export default FormCard;
