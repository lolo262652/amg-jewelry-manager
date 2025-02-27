import React, { useState, useEffect } from 'react';
import { 
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

export default function CompanySettings() {
  const [settings, setSettings] = useState({
    company_name: '',
    logo_url: '',
    address: '',
    siret: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    onDrop: handleDrop
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('amg_company_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
      console.error('Error:', error);
    }
  }

  async function handleDrop(acceptedFiles) {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      // Update settings with new logo URL
      await handleSave({ ...settings, logo_url: publicUrl });
      
    } catch (error) {
      toast.error('Erreur lors du téléchargement du logo');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(newSettings = settings) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('amg_company_settings')
        .upsert(newSettings);

      if (error) throw error;
      
      toast.success('Paramètres enregistrés avec succès');
      await fetchSettings();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Paramètres de l'entreprise
        </Typography>
        
        <Stack spacing={3}>
          {/* Logo Upload */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Logo de l'entreprise
            </Typography>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2
              }}
            >
              <input {...getInputProps()} />
              {settings.logo_url ? (
                <Avatar
                  src={settings.logo_url}
                  alt="Logo"
                  sx={{ width: 100, height: 100, margin: '0 auto' }}
                />
              ) : (
                <Typography>
                  Glissez et déposez un logo ici, ou cliquez pour sélectionner
                </Typography>
              )}
            </Box>
          </Box>

          {/* Company Details */}
          <TextField
            label="Nom de l'entreprise"
            value={settings.company_name}
            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
            fullWidth
          />

          <TextField
            label="Adresse"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />

          <TextField
            label="SIRET"
            value={settings.siret}
            onChange={(e) => setSettings({ ...settings, siret: e.target.value })}
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            fullWidth
          />

          <Button
            variant="contained"
            onClick={() => handleSave()}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
