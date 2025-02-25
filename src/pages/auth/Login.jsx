import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Container,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material'
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    
    try {
      const { error } = await signIn({
        email: data.get('email'),
        password: data.get('password'),
      })
      
      if (error) throw error
      navigate('/')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Connexion
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Adresse email"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mot de passe"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Se connecter
          </Button>
          <Link component={RouterLink} to="/register" variant="body2">
            {"Vous n'avez pas de compte ? Inscrivez-vous"}
          </Link>
        </Box>
      </Box>
    </Container>
  )
}
