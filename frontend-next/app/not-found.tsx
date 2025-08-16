export const metadata = {
  title: '404 - Strona nie znaleziona',
  description: 'Przepraszamy, strona której szukasz nie została znaleziona.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">Strona nie znaleziona</h2>
        <p className="text-muted-foreground max-w-md">
          Przepraszamy, strona której szukasz nie istnieje lub została przeniesiona.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Strona główna
          </a>
          <a
            href="/dashboard"
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}