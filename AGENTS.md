<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Website tabs display sanitized HTML previews in an opaque-origin sandbox; only the app's navigation bridge may run scripts, because original site scripts require an origin and session the preview cannot provide.
- Validate public HTTP(S) website targets and every redirect before fetching; website previews must not request local or private network addresses.
