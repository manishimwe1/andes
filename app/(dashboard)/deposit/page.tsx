import NextAuthSessionProvider from '../../SessionProvider';
import DepositContent from './DepositContent';

export default function DepositPage() {
  return (
    <NextAuthSessionProvider>
      <DepositContent />
    </NextAuthSessionProvider>
  );
}
