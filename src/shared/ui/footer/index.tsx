import { Box, Container, Typography } from '@mui/material';
import { routes } from '@routes';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { SITE_NAME } from '@/shared/config';

const footerLinks = [
  { label: 'Политика конфиденциальности', href: routes.policy() },
  { label: 'Пользовательское соглашение', href: routes.userAgreement() },
  { label: 'Условия использования', href: routes.terms() },
  { label: 'Условия возврата', href: routes.returns() },
] as const;

export function Footer() {
  return (
    <footer>
      <Box
        sx={{
          bgcolor: 'primary.main',
          py: 4,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <NextLink href={routes.home()}>
            <NextImage
              src="/images/logo.svg"
              alt={SITE_NAME}
              height={36}
              width={173}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </NextLink>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: { xs: 1, md: 3 },
            }}
          >
            {footerLinks.map((link) => (
              <Typography
                key={link.href}
                variant="body2"
                color="textContrast"
              >
                <NextLink
                  href={link.href}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </NextLink>
              </Typography>
            ))}
          </Box>

          <Typography
            variant="body2"
            color="textContrast"
            sx={{ opacity: 0.7 }}
          >
            &copy; {new Date().getFullYear()} {SITE_NAME}
          </Typography>
        </Container>
      </Box>
    </footer>
  );
}
