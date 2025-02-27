import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material'
import {
  Category as CategoryIcon,
  People as PeopleIcon,
  Diamond as DiamondIcon,
} from '@mui/icons-material'
import * as productService from '../services/products'
import * as categoryService from '../services/categories'
import * as supplierService from '../services/suppliers'

const StatCard = ({ title, value, icon }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
      bgcolor: 'background.paper',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      {icon}
      <Typography variant="h6" component="div" sx={{ ml: 1 }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="h3" component="div">
      {value}
    </Typography>
  </Paper>
)

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: [],
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
  })

  const loadStats = async () => {
    try {
      const [
        { data: products },
        { data: categories },
        { data: suppliers },
      ] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
        supplierService.getSuppliers(),
      ])

      setStats({
        products: products?.slice(0, 5) || [],
        totalProducts: products?.length || 0,
        totalCategories: categories?.length || 0,
        totalSuppliers: suppliers?.length || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Produits"
            value={stats.totalProducts}
            icon={<DiamondIcon color="primary" sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Catégories"
            value={stats.totalCategories}
            icon={<CategoryIcon color="secondary" sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Fournisseurs"
            value={stats.totalSuppliers}
            icon={<PeopleIcon color="success" sx={{ fontSize: 40 }} />}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Derniers produits ajoutés
            </Typography>
            <List>
              {stats.products.map((product) => (
                <ListItem key={product.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <DiamondIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={product.name}
                    secondary={`Prix: ${product.price}€ - Catégorie: ${product.category?.name}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
