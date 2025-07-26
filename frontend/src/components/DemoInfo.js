import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Info as InfoIcon,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const DemoInfo = () => {
  const demoUsers = [
    {
      name: 'John Doe (Admin)',
      email: 'john@example.com',
      password: 'password123',
      role: 'admin',
    },
    {
      name: 'Jane Smith (User)',
      email: 'jane@example.com',
      password: 'password123',
      role: 'user',
    },
    {
      name: 'Bob Johnson (User)',
      email: 'bob@example.com',
      password: 'password123',
      role: 'user',
    },
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <InfoIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Demo Login Credentials
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Use any of the following credentials to log in and explore the CRM system:
        </Typography>
      </Alert>

      <List>
        {demoUsers.map((user, index) => (
          <React.Fragment key={user.email}>
            <ListItem>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="subtitle1">
                      {user.name}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      Email: {user.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Password: {user.password}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Role: {user.role}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < demoUsers.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> You can also register a new account using any email address.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default DemoInfo; 