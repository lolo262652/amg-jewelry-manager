import React, { useState, useEffect } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PurchaseOrderPDF from './PurchaseOrderPDF';
import { supabase } from '../config/supabase';

export default function PurchaseOrderPreview({ order, open, onClose }) {
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && order) {
      fetchCompanySettings();
    }
  }, [open, order]);

  async function fetchCompanySettings() {
    try {
      const { data, error } = await supabase
        .from('amg_company_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) setCompanySettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  }

  // Ne rien afficher si pas de commande ou dialogue fermé
  if (!open || !order) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        Prévisualisation du bon de commande N°{order.order_number}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            Chargement...
          </Box>
        ) : (
          <PDFViewer
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          >
            <PurchaseOrderPDF order={order} companySettings={companySettings} />
          </PDFViewer>
        )}
      </DialogContent>

      <DialogActions>
        {!loading && (
          <PDFDownloadLink
            document={<PurchaseOrderPDF order={order} companySettings={companySettings} />}
            fileName={`bon-commande-${order.order_number}.pdf`}
            style={{
              textDecoration: 'none',
            }}
          >
            {({ loading: pdfLoading }) => (
              <Button
                variant="contained"
                color="primary"
                disabled={pdfLoading}
              >
                {pdfLoading ? 'Génération...' : 'Télécharger le PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </DialogActions>
    </Dialog>
  );
}
