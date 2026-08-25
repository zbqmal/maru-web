import { Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type QuestionTipProps = {
  isLeader: boolean;
};

const QuestionTip = ({ isLeader }: QuestionTipProps) => {
  return (
    <aside aria-label="질문 설정 정보" className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
      {isLeader ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
              <Crown className="h-4 w-4" />
              리더 전용
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-amber-700">
              질문 추가, 수정, 삭제는 그룹 리더만 할 수 있어요. 멤버는 답변만 작성할 수 있어요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">읽기 전용</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              질문 추가·수정·삭제는 그룹 리더만 가능해요. 리더에게 질문 수정을 요청해보세요.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">질문 작성 팁</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true">💡</span>
              <span>
                <strong className="text-foreground">구체적으로 질문해보세요</strong>
                <br />
                생각하기 쉽고 답하기 쉬워져요.
              </span>
            </li>
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true">💬</span>
              <span>
                <strong className="text-foreground">매일 다른 주제로</strong>
                <br />
                다양한 이야기를 나눌 수 있어요.
              </span>
            </li>
            <li className="flex items-start gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true">🌱</span>
              <span>
                <strong className="text-foreground">서로에게 도움이 되는 질문을</strong>
                <br />
                함께 성장하는 시간을 만들어봐요.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
};

export default QuestionTip;
