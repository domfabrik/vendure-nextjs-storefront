import { Box, Typography } from '@mui/material';
import { contacts, routes } from '@routes';
import NextLink from 'next/link';

const catalogLinks = [
  { label: 'Спальня', href: routes.collection('spalni') },
  { label: 'Гостиная', href: routes.collection('gostinyie') },
  { label: 'Кухня', href: routes.collection('kuhnya') },
  { label: 'Мягкая мебель', href: routes.collection('myagkaya_mebel') },
  { label: 'Матрасы', href: routes.collection('matrasy-podushki') },
];

const customerLinks = [
  { label: 'Как купить', href: routes.howToBuy() },
  { label: 'Доставка', href: routes.delivery() },
  { label: 'Оплата', href: routes.howToBuy() },
  { label: 'Условия возврата', href: routes.returns() },
  { label: 'О компании', href: routes.about() },
];

const bottomLinks = [
  { label: 'Политика конфиденциальности', href: routes.policy() },
  { label: 'Пользовательское соглашение', href: routes.userAgreement() },
];

const linkSx = {
  color: '#C9D1DD',
  fontSize: 14,
  lineHeight: 1.8,
  '&:hover': { color: '#FFFFFF' },
};

export function Footer() {
  return (
    <footer style={{ background: '#1B2B45', color: '#C9D1DD', fontSize: 14 }}>
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 1, sm: 4 },
          pt: 7,
          pb: 4,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 4,
        }}
      >
        {/* Бренд */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Typography sx={{ fontSize: 22, color: '#FFFFFF' }}>
            <span style={{ fontWeight: 800 }}>Дом</span>
            <span style={{ fontWeight: 500, color: '#9AA6B8' }}>Фабрик</span>
          </Typography>
          <Typography sx={{ color: '#C9D1DD', fontSize: 14, lineHeight: 1.5 }}>Мебель напрямую от фабрик с доставкой по России</Typography>
        </Box>

        {/* Каталог */}
        <nav
          aria-label="Каталог"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Typography sx={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>Каталог</Typography>
          {catalogLinks.map((link) => (
            <NextLink
              key={link.href}
              href={link.href}
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={linkSx}>{link.label}</Typography>
            </NextLink>
          ))}
        </nav>

        {/* Покупателям */}
        <nav
          aria-label="Покупателям"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Typography sx={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>Покупателям</Typography>
          {customerLinks.map((link) => (
            <NextLink
              key={link.label}
              href={link.href}
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={linkSx}>{link.label}</Typography>
            </NextLink>
          ))}
        </nav>

        {/* Контакты */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography sx={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>Контакты</Typography>
          <a
            href={contacts.phoneHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography sx={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700 }}>{contacts.phone}</Typography>
          </a>
          <Typography sx={{ color: '#C9D1DD', fontSize: 14 }}>{contacts.workingHours}</Typography>
          <Typography sx={{ color: '#C9D1DD', fontSize: 14 }}>{contacts.address}</Typography>
          <a
            href={contacts.emailHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography sx={{ color: '#C9D1DD', fontSize: 14 }}>{contacts.email}</Typography>
          </a>
        </Box>
      </Box>

      {/* Нижняя полоса */}
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          px: { xs: 1, sm: 4 },
          py: 2.5,
          borderTop: '1px solid #34445E',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'space-between',
          fontSize: 13,
        }}
      >
        <Typography sx={{ fontSize: 13, color: '#C9D1DD' }}>&copy; {new Date().getFullYear()} DomFabrik</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          {bottomLinks.map((link) => (
            <NextLink
              key={link.href}
              href={link.href}
              style={{ textDecoration: 'none' }}
            >
              <Typography sx={{ fontSize: 13, color: '#C9D1DD', '&:hover': { color: '#FFFFFF' } }}>{link.label}</Typography>
            </NextLink>
          ))}
        </Box>
      </Box>
    </footer>
  );
}
