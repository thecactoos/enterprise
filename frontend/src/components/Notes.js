import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import apiService from '../services/api.service';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    clientId: '',
    isImportant: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notes, clients] = await Promise.all([
        apiService.getNotes(),
        apiService.getClients(),
      ]);
      setNotes(notes);
      setClients(clients);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData(note);
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        clientId: '',
        isImportant: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      clientId: '',
      isImportant: false,
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingNote) {
        await apiService.updateNote(editingNote.id, formData);
      } else {
        await apiService.createNote(formData);
      }
      fetchData();
      handleCloseDialog();
    } catch (error) {
      setError('Failed to save note');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await apiService.deleteNote(id);
        fetchData();
      } catch (error) {
        setError('Failed to delete note');
      }
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Note
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" gutterBottom>
                    {note.title}
                  </Typography>
                  {note.isImportant && (
                    <StarIcon color="warning" />
                  )}
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Client: {getClientName(note.clientId)}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {note.content.length > 100 
                    ? `${note.content.substring(0, 100)}...` 
                    : note.content
                  }
                </Typography>
                
                <Typography variant="caption" color="textSecondary">
                  Created: {new Date(note.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              
              <CardActions>
                <IconButton size="small" onClick={() => handleOpenDialog(note)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(note.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNote ? 'Edit Note' : 'Add New Note'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="title"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Client</InputLabel>
            <Select
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              required
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            name="content"
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={formData.content}
            onChange={handleInputChange}
            required
          />
          
          <Box sx={{ mt: 2 }}>
            <Chip
              label="Important"
              color={formData.isImportant ? "warning" : "default"}
              onClick={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
              icon={formData.isImportant ? <StarIcon /> : null}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNote ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Notes; 