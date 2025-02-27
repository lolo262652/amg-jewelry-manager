import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 'auto',
  },
  companyInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
  },
  notesSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bfbfbf',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 11,
    color: '#444',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
  text: {
    marginBottom: 5,
  },
});

const PurchaseOrderPDF = ({ order, companySettings }) => {
  if (!order) return null;

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date non valide';
    }
  };

  const calculateTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const total = quantity * price;
      console.log('Item:', item.product?.name, 'Quantity:', quantity, 'Price:', price, 'Total:', total);
      return sum + total;
    }, 0);
  };

  const calculateLineTotal = (quantity, price) => {
    const qty = Number(quantity) || 0;
    const unitPrice = Number(price) || 0;
    const total = qty * unitPrice;
    console.log('Line calculation - Qty:', qty, 'Price:', unitPrice, 'Total:', total);
    return total;
  };

  // Vérifier et nettoyer les données de la commande
  const sanitizedOrder = {
    ...order,
    items: order.items?.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      product: item.product || { name: 'Produit inconnu' }
    })) || []
  };

  const totalHT = calculateTotal(sanitizedOrder.items);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT * 1.2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            {companySettings?.logo_url && (
              <Image style={styles.logo} src={companySettings.logo_url} />
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.text}>{companySettings?.company_name || 'AMG Bijoux'}</Text>
            <Text style={styles.text}>{companySettings?.address}</Text>
            <Text style={styles.text}>SIRET: {companySettings?.siret}</Text>
            <Text style={styles.text}>{companySettings?.email}</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.title}>
          <Text>Bon de Commande N°{order.order_number}</Text>
        </View>

        {/* Informations fournisseur */}
        <View style={styles.section}>
          <Text style={styles.text}>Fournisseur:</Text>
          <Text style={styles.text}>{order.supplier?.name}</Text>
          <Text style={styles.text}>{order.supplier?.address}</Text>
          <Text style={styles.text}>Contact: {order.supplier?.contact}</Text>
          <Text style={styles.text}>Email: {order.supplier?.email}</Text>
        </View>

        {/* Date de commande */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Date de commande: {formatDate(order.order_date)}
          </Text>
        </View>

        {/* Tableau des produits */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Produit</Text>
            <Text style={styles.tableCell}>Quantité</Text>
            <Text style={styles.tableCell}>Prix unitaire</Text>
            <Text style={styles.tableCell}>Total</Text>
          </View>
          {sanitizedOrder.items?.map((item, index) => {
            const lineTotal = calculateLineTotal(item.quantity, item.unit_price);
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.product?.name || 'Produit inconnu'}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>{item.unit_price.toFixed(2)}€</Text>
                <Text style={styles.tableCell}>{lineTotal.toFixed(2)}€</Text>
              </View>
            );
          })}
        </View>

        {/* Notes */}
        {order.notes && order.notes.trim() !== '' && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes :</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* Total */}
        <View style={[styles.section, { alignItems: 'flex-end' }]}>
          <Text style={styles.text}>Total HT: {totalHT.toFixed(2)}€</Text>
          <Text style={styles.text}>TVA (20%): {tva.toFixed(2)}€</Text>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>
            Total TTC: {totalTTC.toFixed(2)}€
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>
            {companySettings?.company_name || 'AMG Bijoux'} - SIRET: {companySettings?.siret}
          </Text>
          <Text>{companySettings?.address}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PurchaseOrderPDF;
