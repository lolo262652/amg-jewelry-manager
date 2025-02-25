import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '../config/supabase'

export default function Settings() {
  const { user } = useAuth()
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      toast.success('Mot de passe modifié avec succès')
      setOpenPasswordDialog(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error('Erreur lors de la modification du mot de passe')
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Informations du compte
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Email"
              secondary={user?.email}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Mot de passe"
              secondary="Modifiez votre mot de passe"
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                onClick={() => setOpenPasswordDialog(true)}
              >
                Modifier
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Notifications par email"
              secondary="Recevoir des notifications par email"
            />
            <ListItemSecondaryAction>
              <Switch />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Notifications système"
              secondary="Recevoir des notifications dans l'application"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>

      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier le mot de passe</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Mot de passe actuel"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="Nouveau mot de passe"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value,
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Annuler
          </Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
