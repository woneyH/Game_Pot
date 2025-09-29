export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">게임팟</h3>
            <p className="text-muted-foreground text-sm">게임 친구를 찾는 가장 쉬운 방법</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-3">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  매칭
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  커뮤니티
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  랭킹
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-3">지원</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  도움말
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  신고
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-3">회사</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  소개
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  채용
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2025 게임팟. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
