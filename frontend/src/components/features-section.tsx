import { Clock, Users, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">왜 게임팟을 선택해야 할까요?</h2>
          <p className="text-muted-foreground text-lg">안전하고 빠른 매칭으로 최고의 게임 경험을 제공합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">빠른 매칭</h3>
              <p className="text-muted-foreground text-sm">평균 3분 이내에 적합한 팀원을 찾아드립니다</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">실력 매칭</h3>
              <p className="text-muted-foreground text-sm">비슷한 실력의 플레이어들과 매칭됩니다</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">다양한 게임</h3>
              <p className="text-muted-foreground text-sm">인기 게임부터 인디 게임까지 모든 장르 지원</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
