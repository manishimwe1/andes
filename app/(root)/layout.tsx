import BottomNav from "@/components/BottomNav";
import Navigation from "@/components/Navigation";
import NavigationWrapper from "@/components/NavigationWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Navigation />

      {children}
      <BottomNav />
    </main>
  );
}
