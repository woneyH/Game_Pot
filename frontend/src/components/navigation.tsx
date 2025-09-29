import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-foreground">게임팟</h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              홈
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              매칭
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              커뮤니티
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
            <Button size="sm">회원가입</Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
