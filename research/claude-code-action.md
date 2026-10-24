# Cấu hình `anthropics/claude-code-action` để tự động review PR

Ticket: jamestran1/covay#3 (con của map #1). Ngày tra cứu: 2026-10-24.
Bối cảnh: monorepo TypeScript, public, open source, một người phát triển.

## TL;DR / Khuyến nghị

- Dùng `anthropics/claude-code-action@v1` (major hiện tại; tag `v1` trỏ tới bản mới nhất, ví dụ `v1.0.261`). [S1][S3]
- Auth: với dev solo đã có gói Pro/Max, dùng `CLAUDE_CODE_OAUTH_TOKEN` (tạo bằng `claude setup-token`, hạn 1 năm, tính vào quota subscription, không tốn tiền API). Nếu muốn tách chi phí CI khỏi quota cá nhân, dùng `ANTHROPIC_API_KEY` từ Claude Console. [S2][S5]
- Cài Claude GitHub App (cách nhanh nhất: chạy `/install-github-app` trong Claude Code, nó cài App, tạo secret và mở PR workflow). [S2]
- Workflow: trigger `pull_request` (không dùng `pull_request_target`), chạy plugin `code-review` với `--comment`, permissions tối thiểu + `id-token: write`, thêm `timeout-minutes`, `concurrency`, `--max-turns`, chọn model Sonnet. [S2]
- Chuẩn code: đặt trong `CLAUDE.md` ở root (action luôn lấy bản từ base branch, PR không sửa được nội dung review rules). [S2][S4]
- PR từ fork: secret không có, action cũng từ chối actor không có quyền write. Chấp nhận việc fork PR không được review tự động, chặn job bằng `if:` để không báo lỗi đỏ. [S2][S4][S7]
- Không dùng review của Claude làm cổng chặn merge mặc định. Nếu muốn, có thể làm required check bằng `--json-schema` + step `exit 1`, nhưng nên để ở dạng tư vấn.
- Dịch vụ "Code Review" managed (không cần workflow) chỉ dành cho gói Team/Enterprise, nên không áp dụng cho dev solo dùng Pro/Max. [S6]

## 1. Xác thực (auth)

Action hỗ trợ các cách sau [S2][S3]:

| Input | Nguồn | Ghi chú |
|---|---|---|
| `anthropic_api_key` | API key từ Claude Console | Trả tiền theo token API. Phù hợp khi dùng chung cho nhiều repo/org. |
| `claude_code_oauth_token` | `claude setup-token` (Pro, Max, Team, Enterprise) | Token OAuth hạn một năm; lệnh in token ra terminal, không lưu ở đâu cả. Run dùng quota subscription thay vì billing API. Gắn với subscription của người tạo token. [S2][S5] |
| `anthropic_federation_rule_id` + `anthropic_organization_id` (+ service account / workspace) | Workload Identity Federation | Không lưu secret tĩnh; đổi OIDC token của GitHub lấy token Anthropic ngắn hạn. Cần quyền admin org trên Console. Không đặt chung với key tĩnh (key tĩnh sẽ thắng). [S3] |
| `use_bedrock` / `use_vertex` | Cloud provider | Không cần cho trường hợp này. |

Lưu secret ở Settings > Secrets and variables > Actions, tham chiếu bằng `${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`. Không bao giờ hardcode key trong YAML. [S3]

Lưu ý nhỏ: `classify_inline_comments` (mặc định `true`, dùng Haiku để lọc comment inline "thử nghiệm" trước khi đăng) cần `anthropic_api_key`; với federation nó bị bỏ qua và comment được đăng thẳng. [S3] Tài liệu không nói rõ trường hợp OAuth token (chưa xác minh).

## 2. GitHub App vs chỉ workflow

- **Claude GitHub App chính thức** (https://github.com/apps/claude): cách mặc định. Action đổi OIDC token lấy token của App, nên workflow cần `id-token: write`. Comment hiện dưới tên `claude[bot]`; `use_sticky_comment` chỉ hoạt động với danh tính này. Khi cài App bạn chấp nhận toàn bộ quyền của nó (App dùng chung cho Code Review, auto-fix,...). [S2][S4]
- **Không cài App, chỉ workflow**: truyền `github_token` (custom GitHub App của bạn qua `actions/create-github-app-token`, hoặc `secrets.GITHUB_TOKEN`). Comment sẽ hiện dưới tên khác, sticky comment không cập nhật đúng. Commit bằng `GITHUB_TOKEN` không kích hoạt CI. [S2][S3][S4]
- Với repo cá nhân: cài App chính thức là đơn giản nhất. `/install-github-app` chỉ chạy với repo github.com; cần quyền admin repo. [S1][S2]

## 3. Workflow tối thiểu tự động review mọi PR

Dựa trên ví dụ "Run a skill" trong docs chính thức [S2], thêm các giới hạn chi phí và chặn fork:

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    # Fork PR: không có secret và tác giả không có quyền write, nên bỏ qua
    if: github.event.pull_request.head.repo.full_name == github.repository && !github.event.pull_request.draft
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write   # bắt buộc cho xác thực qua Claude GitHub App
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          # hoặc: anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: |
            --allowedTools "mcp__github_inline_comment__create_inline_comment"
            --model claude-sonnet-5-5
            --max-turns 30
```

Ghi chú:
- Có `prompt` nghĩa là "automation mode": Claude chạy ngay, không cần `@claude`. Không có `prompt` thì là "interactive mode" (chờ mention). [S2]
- Docs chính thức để `pull-requests: read` vì comment được đăng qua token của Claude App, không qua `GITHUB_TOKEN`. Ví dụ `pr-review-comprehensive.yml` trong repo action thì dùng `pull-requests: write`. [S2][S8]
- Phải giữ `--allowedTools "mcp__github_inline_comment__create_inline_comment"` trong `claude_args`: action chỉ khởi động MCP server đăng inline comment khi tool này được liệt kê. [S2]
- Plugin `code-review` tự bỏ qua PR draft/closed, PR tầm thường/tự động, và PR đã có comment từ Claude. [S2]
- Model ID `claude-sonnet-5-5` (cũng có `claude-opus-5-5`, `claude-haiku-5-5`) theo trang Models overview [S10]. Bash bị tắt mặc định; chỉ mở thêm tool cụ thể khi cần (ví dụ `Bash(gh pr diff:*)`). [S4]
- Có thể viết prompt riêng thay vì plugin (xem `examples/pr-review-comprehensive.yml`, dùng `track_progress: true` + tool `gh pr comment`, `gh pr diff`, `gh pr view`). [S8]

## 4. Đưa chuẩn code vào review

- `CLAUDE.md` ở root: mô tả code style, tiêu chí review, quy tắc dự án. Claude đọc nó mỗi lần chạy, nên giữ ngắn gọn để đỡ tốn token. [S2]
- Với PR, action khôi phục từ **base branch** các đường dẫn: `.claude/`, `.mcp.json`, `.claude.json`, `.gitmodules`, `.ripgreprc`, `CLAUDE.md`, `CLAUDE.local.md`, `.husky/`. Bản do PR sửa chỉ được giữ ở `.claude-pr/` để tham khảo. Nghĩa là người mở PR không thể đổi quy tắc review trong chính PR đó. Mọi file khác (`package.json`, lockfile, config lint) vẫn lấy từ PR head. [S4]
- Ngoài ra có thể nhét tiêu chí trực tiếp vào `prompt`, hoặc dùng `settings` (JSON) và `--append-system-prompt` trong `claude_args`. [S3]
- Monorepo: có thể đặt `CLAUDE.md` ở từng package (cơ chế memory của Claude Code) nhưng bản ở root là thứ được bảo vệ từ base branch theo danh sách trên.

## 5. Inline comment vs summary comment

- Plugin `code-review` + `--comment`: một inline comment cho mỗi vấn đề, hoặc một comment tổng kết khi không tìm thấy gì. Bỏ `--comment` thì kết quả chỉ nằm trong log workflow. [S2]
- `use_sticky_comment: true`: gom vào một comment duy nhất, cập nhật mỗi lần chạy (chỉ cho sự kiện `pull_request`, chỉ khi comment dưới tên `claude[bot]`). [S3][S4]
- `track_progress: true`: tạo comment theo dõi tiến độ với checkbox, đánh dấu hoàn tất khi xong. [S3][S8]
- `include_fix_links` (mặc định `true`): thêm link "Fix this" mở Claude Code với ngữ cảnh để sửa. [S3]

## 6. Chi phí mỗi PR và cách giới hạn

Nguồn chính thức không công bố con số "cost per PR" cho action. Chi phí gồm phút GitHub Actions (miễn phí cho repo public trên runner GitHub-hosted tiêu chuẩn) và token. Với OAuth token, run tính vào quota subscription Pro/Max, không bị tính tiền API. [S2]

Giá API hiện tại (input / output, USD mỗi triệu token) [S9]:

| Model | Input | Output | Cache hit |
|---|---|---|---|
| Opus 5.5 | $4 | $20 | $0.20 |
| Sonnet 5.5 | $2 | $10 | $0.10 |
| Haiku 5.5 (prompt tới 100k token) | $0.10 | $0.50 | $0.01 |

**Ước tính (không phải số liệu chính thức):** một review PR nhỏ đến vừa thường đọc khoảng 100k đến 500k token input (phần lớn là cache hit qua nhiều turn) và sinh khoảng 5k đến 20k token output. Với Sonnet 5.5 ước chừng $0.1 đến $1 mỗi PR; Opus 5.5 khoảng gấp đôi; Haiku 5.5 rẻ hơn khoảng 20 lần nhưng review nông hơn. Đo thực tế bằng `execution_file` output của action hoặc trang Usage của Console.

Cách giới hạn [S2][S3]:
- `--model` trong `claude_args` (input `model` cũ đã deprecated).
- `--max-turns N` trong `claude_args` (input `max_turns` cũ đã deprecated).
- `timeout-minutes` ở job.
- `concurrency` với `cancel-in-progress` để push liên tiếp không chạy chồng.
- Lọc PR: `paths`/`paths-ignore`, bỏ draft, chỉ chạy `opened` + `ready_for_review` nếu muốn bỏ `synchronize` (xem `examples/pr-review-filtered-paths.yml`, `pr-review-filtered-authors.yml`). [S3]
- Giữ `CLAUDE.md` ngắn.

## 7. PR từ fork

- Trên repo public, GitHub không truyền secret cho run kích hoạt bởi `pull_request` từ fork, nên review chỉ chạy với PR từ branch trong cùng repo. [S2][S7]
- Ngoài ra action kiểm tra người kích hoạt phải có quyền write vào repo và không phải bot (trừ khi có trong `allowed_bots`). Contributor ngoài thường không có quyền write, nên run fail. [S2][S4]
- `allowed_non_write_users` cho phép bỏ qua kiểm tra quyền write, nhưng docs ghi rõ là RỦI RO, chỉ dùng với `github_token: ${{ secrets.GITHUB_TOKEN }}` và permissions tối thiểu. [S4]
- **Không** chuyển sang `pull_request_target` rồi checkout PR head vào workspace: run đó có secret của repo gốc và chạy code không tin cậy (lỗ hổng "pwn request"). Nếu thật sự cần, checkout base ở root và PR head vào thư mục con, truyền `--add-dir pr-head`. [S4]
- Khuyến nghị cho covay: dùng điều kiện `if: github.event.pull_request.head.repo.full_name == github.repository` để fork PR bị skip sạch sẽ. Muốn review fork PR thì maintainer chạy `/code-review` thủ công ở local hoặc đẩy branch về repo.
- Dependabot/Renovate PR: bị chặn vì là bot, và cũng không có Actions secret thường. Thêm vào `allowed_bots` nếu muốn review (cần thêm secret Dependabot riêng).

## 8. Dùng làm required status check / chặn merge

- Job workflow tự nó là một check trên PR và có thể đặt làm required trong branch protection/ruleset. Action có output `conclusion` (`success`/`failure`), nhưng `success` chỉ có nghĩa là Claude chạy xong, không có nghĩa là code ổn. [S3]
- Muốn chặn theo kết quả review: dùng `--json-schema` trong `claude_args` để lấy `structured_output` (ví dụ `{"blocking_issues": number}`), rồi thêm step `if: fromJSON(steps.review.outputs.structured_output).blocking_issues > 0` chạy `exit 1`. Đây là cơ chế có tài liệu cho structured output; việc áp vào gating là thiết kế của mình. [S3]
- Rủi ro khi bắt buộc: LLM không tất định (false positive chặn merge), lỗi hết quota/API làm job fail, fork PR không chạy được. Với required check, job bị skip do điều kiện `if` được tính là Success, còn workflow không chạy do lọc `paths` sẽ treo ở Pending. [S7b]
- Để so sánh: dịch vụ Code Review managed cố ý báo check run ở trạng thái `neutral`, không bao giờ `failure`, và "never approves or blocks the pull request". [S6]
- Khuyến nghị: để review ở dạng tư vấn (không required). Gate merge bằng typecheck/lint/test thông thường. Nếu sau này muốn, có thể bật "Require conversation resolution" để buộc xử lý từng inline comment.

## 9. Các điểm cần quyết định cho covay

1. OAuth token (miễn phí trong quota Pro/Max) hay API key (tách bạch chi phí)?
2. Review mỗi push (`synchronize`) hay chỉ khi mở/ready?
3. Model: Sonnet 5.5 mặc định, có thể nâng Opus cho PR lớn.
4. Nội dung `CLAUDE.md` cho chuẩn TypeScript monorepo (ticket riêng?).

## Nguồn

- [S1] README, anthropics/claude-code-action: https://github.com/anthropics/claude-code-action/blob/main/README.md ; release/tag: https://github.com/anthropics/claude-code-action/tags
- [S2] Claude Code GitHub Actions (docs chính thức): https://code.claude.com/docs/en/github-actions
- [S3] docs/usage.md, docs/configuration.md, docs/setup.md, action.yml trong repo action: https://github.com/anthropics/claude-code-action/tree/main/docs , https://github.com/anthropics/claude-code-action/blob/main/action.yml
- [S4] docs/security.md, docs/faq.md: https://github.com/anthropics/claude-code-action/blob/main/docs/security.md , https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md
- [S5] Authentication, "Generate a long-lived token": https://code.claude.com/docs/en/authentication
- [S6] Code Review (managed, Team/Enterprise): https://code.claude.com/docs/en/code-review , https://code.claude.com/docs/en/code-review-pull-requests
- [S7] GitHub: secrets không truyền cho workflow từ fork: https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions ; [S7b] required checks bị skip: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks
- [S8] examples/pr-review-comprehensive.yml: https://github.com/anthropics/claude-code-action/blob/main/examples/pr-review-comprehensive.yml
- [S9] Bảng giá API: https://platform.claude.com/docs/en/about-claude/pricing
- [S10] Models overview: https://platform.claude.com/docs/en/about-claude/models/overview
