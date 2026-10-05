import { Box, Typography } from '@mui/material';
import { contacts, routes } from '@routes';
import NextLink from 'next/link';
import { AnalyticsSettingsTrigger } from './analytics-settings-trigger';

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
  color: 'footer.text',
  fontSize: 14,
  lineHeight: 1.8,
  '&:hover': { color: '#FFFFFF' },
} as const;

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
            <Typography
              component="span"
              sx={{ fontWeight: 500, color: 'footer.textSubdued' }}
            >
              Фабрик
            </Typography>
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'footer.text', lineHeight: 1.5 }}
          >
            Мебель напрямую от фабрик с доставкой по России
          </Typography>
        </Box>

        {/* Каталог */}
        <nav
          aria-label="Каталог"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: '#FFFFFF' }}
          >
            Каталог
          </Typography>
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
          <Typography
            variant="subtitle2"
            sx={{ color: '#FFFFFF' }}
          >
            Покупателям
          </Typography>
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
          <Typography
            variant="subtitle2"
            sx={{ color: '#FFFFFF' }}
          >
            Контакты
          </Typography>
          <a
            href={contacts.phoneHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography
              variant="h6"
              sx={{ color: '#FFFFFF' }}
            >
              {contacts.phone}
            </Typography>
          </a>
          <Typography
            variant="body2"
            sx={{ color: 'footer.text' }}
          >
            {contacts.workingHours}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'footer.text' }}
          >
            {contacts.address}
          </Typography>
          <a
            href={contacts.emailHref}
            style={{ textDecoration: 'none' }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'footer.text' }}
            >
              {contacts.email}
            </Typography>
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
          borderTop: '1px solid',
          borderTopColor: 'footer.border',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'space-between',
          fontSize: 13,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: 'footer.text' }}
        >
          &copy; {new Date().getFullYear()} DomFabrik
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          {bottomLinks.map((link) => (
            <NextLink
              key={link.href}
              href={link.href}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                variant="overline"
                sx={{ color: 'footer.text', '&:hover': { color: '#FFFFFF' } }}
              >
                {link.label}
              </Typography>
            </NextLink>
          ))}
          <Typography
            variant="overline"
            sx={{ color: 'footer.text' }}
          >
            <AnalyticsSettingsTrigger />
          </Typography>
        </Box>
      </Box>
    </footer>
  );
}
