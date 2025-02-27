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
  Stack,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '../config/supabase'
import CompanySettings from '../components/CompanySettings'

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
      console.error('Error:', error)
    }
  }

  return (
    <Stack spacing={3}>
      <CompanySettings />
      
      <Paper>
        <Box p={3}>
          <Typography variant="h5" gutterBottom>
            Paramètres du compte
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
                secondary="Modifier votre mot de passe"
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
        </Box>
      </Paper>

      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
      >
        <DialogTitle>Modifier le mot de passe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                type="password"
                label="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                fullWidth
              />
              <TextField
                type="password"
                label="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                fullWidth
              />
              <TextField
                type="password"
                label="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                fullWidth
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Annuler</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
