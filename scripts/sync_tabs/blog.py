import streamlit as st
import os
import json
from datetime import datetime

from sync_tabs.shared import (
    parse_projects_file,
    parse_skills_file,
    run_safe_git_command,
    fetch_github_repo_metadata,
    call_gemini,
    run_async_task,
    validate_blog_fields,
    slugify,
    atomic_write_text,
    parse_resume_file,
    write_resume_file,
    trigger_revalidation,
    delete_blog_post,
    sync_blog_post,
    fetch_blog_posts,
    publish_post_to_all_layers,
    delete_post_from_all_layers,
    fetch_pending_ai_drafts,
    fetch_rss_news,
    get_rss_feeds,
    save_rss_feeds,
    HAS_SYNC,
    read_local_path_context,
)
from sync_tabs.retriever_query import query_system_memory, format_evidence_block
from sync_git import commit_and_push_paths


def render_blog_tab():
    st.markdown('<div class="section-header">AI Content Studio & Publisher</div>', unsafe_allow_html=True)
    st.write("Generate, edit, audit SEO, and publish high-impact technical articles and newsjacking posts.")

    tab_gen, tab_edit, tab_queue, tab_pub = st.tabs([
        "🔥 AI Generators",
        "📝 Editor & SEO Audit",
        "📬 Pending Drafts Queue",
        "📚 Published Library"
    ])

    # =========================================================================
    # TAB 1: 🔥 AI GENERATORS & NEWSJACKING
    # =========================================================================
    with tab_gen:
        gen_mode = st.radio(
            "Select AI Generator Engine:",
            ["📰 Trending Newsjacking", "🧠 Codebase & Git Brainstormer", "✍️ Ghostwriter Co-Pilot"],
            horizontal=True,
            key="blog_gen_mode"
        )
        st.markdown("---")

        # ---------------------------------------------------------------------
        # ENGINE 1: 📰 TRENDING NEWSJACKING
        # ---------------------------------------------------------------------
        if gen_mode == "📰 Trending Newsjacking":
            st.subheader("📰 Trending AI/Tech Newsjacking Engine")
            st.write("Scrapes top AI & tech news feeds, matches them against your portfolio projects, and synthesizes code-first technical case studies.")

            col_rss_btn, col_rss_clear = st.columns([3, 1])
            with col_rss_btn:
                if st.button("🔍 Preview Top RSS News Items", use_container_width=True, key="btn_fetch_rss"):
                    items = fetch_rss_news()
                    st.session_state.rss_news_items = items
                    if items:
                        st.success(f"Fetched {len(items)} trending tech news items!")
                    else:
                        st.warning("Could not fetch RSS items. Please check network.")

            with col_rss_clear:
                if st.button("Clear RSS", use_container_width=True, key="btn_clear_rss"):
                    if "rss_news_items" in st.session_state:
                        del st.session_state.rss_news_items
                    st.rerun()

            with st.expander("⚙️ Manage Newsjacking RSS Feeds"):
                current_feeds = get_rss_feeds()
                st.markdown("**Active Monitored Feeds:**")
                for f_idx, feed in enumerate(current_feeds):
                    st.caption(f"{f_idx+1}. **{feed['name']}**: `{feed['url']}`")
                
                new_feed_name = st.text_input("New Feed Name:", placeholder="e.g. VentureBeat AI", key="new_rss_name")
                new_feed_url = st.text_input("New Feed RSS URL:", placeholder="https://example.com/rss", key="new_rss_url")
                
                col_add_rss, col_reset_rss = st.columns(2)
                with col_add_rss:
                    if st.button("➕ Add RSS Feed", use_container_width=True, key="btn_add_rss"):
                        if new_feed_name and new_feed_url:
                            updated = current_feeds + [{"name": new_feed_name.strip(), "url": new_feed_url.strip()}]
                            if save_rss_feeds(updated):
                                st.success(f"Added feed '{new_feed_name}'!")
                                st.rerun()
                        else:
                            st.error("Please enter both feed name and URL.")
                with col_reset_rss:
                    if st.button("🔄 Reset to Default Feeds", use_container_width=True, key="btn_reset_rss"):
                        from sync_tabs.blog_service import DEFAULT_RSS_FEEDS
                        if save_rss_feeds(DEFAULT_RSS_FEEDS):
                            st.success("Reset feeds to default list!")
                            st.rerun()

            news_items = st.session_state.get("rss_news_items", [])
            if news_items:
                st.markdown("##### Current Trending News Candidates:")
                for n_item in news_items:
                    st.markdown(f"- **[{n_item['source']}]** [{n_item['title']}]({n_item['url']})")

            st.markdown("---")
            st.info("💡 Click below to run the complete AI Newsjacking pipeline in the background and output a new draft to Supabase.")

            if st.button("⚡ Generate AI Newsjacking Draft", type="primary", use_container_width=True, key="btn_run_newsjacking"):
                def run_newsjacking_task():
                    import sys
                    import subprocess
                    cmd = [sys.executable, "scripts/ai_blog_generator.py", "--publish"]
                    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=os.getcwd())
                    if proc.returncode != 0:
                        raise ValueError(proc.stderr or proc.stdout)
                    return proc.stdout

                run_async_task(run_newsjacking_task, "newsjacking_gen_task")
                st.rerun()

            nj_status = st.session_state.get("newsjacking_gen_task_status", "idle")
            if nj_status == "running":
                st.info("🤖 Scanning news feeds and synthesizing AI blog draft in background...")
            elif nj_status == "success":
                st.success("🎉 AI Newsjacking Draft synthesized and saved to Supabase! Check the '📬 Pending Drafts Queue' tab.")
                st.session_state.newsjacking_gen_task_status = "idle"
            elif nj_status == "error":
                err = st.session_state.get("newsjacking_gen_task_error", "Unknown error")
                st.error(f"Newsjacking generation failed: {err}")
                st.session_state.newsjacking_gen_task_status = "idle"

        # ---------------------------------------------------------------------
        # ENGINE 2: 🧠 CODEBASE & GIT BRAINSTORMER
        # ---------------------------------------------------------------------
        elif gen_mode == "🧠 Codebase & Git Brainstormer":
            st.subheader("💡 Brainstorm Ideas from Codebase & Git")
            st.write("Let Gemini analyze your projects, skills, package dependencies, and recent git commits to propose engineering blog topics.")

            ideas_status = st.session_state.get("blog_ideas_task_status", "idle")
            if ideas_status == "success":
                ideas_res = st.session_state.get("blog_ideas_task_result")
                if ideas_res:
                    ideas_list = ideas_res.get("ideas", [])
                    st.session_state.blog_brainstormed_ideas = ideas_list
                    if ideas_list:
                        st.success("Successfully generated blog ideas!")
                    else:
                        st.warning("⚠️ No ideas were returned by Gemini.")
                st.session_state.blog_ideas_task_status = "idle"
            elif ideas_status == "error":
                ideas_err = st.session_state.get("blog_ideas_task_error", "Unknown error")
                st.error(f"Error brainstorming ideas: {ideas_err}")
                st.session_state.blog_ideas_task_status = "idle"

            if ideas_status == "running":
                st.info("🧠 Analyzing codebase metadata and brainstorming technical articles...")

            projects_list = []
            try:
                projects_list = parse_projects_file()
            except Exception:
                pass

            projects_with_github = ["Current Website Codebase (Prateek_website)"]
            if projects_list:
                projects_with_github.extend([
                    p.get("title") for p in projects_list 
                    if p.get("title") and p.get("githubUrl")
                ])

            selected_github_projects = st.multiselect(
                "Select projects to fetch GitHub repository details for deeper analysis:",
                options=projects_with_github,
                default=["Current Website Codebase (Prateek_website)"],
                key="brainstorm_selected_projects"
            )

            st.text_input(
                "Brainstorm Focus / Technical Angle (optional):",
                placeholder="e.g. Focus on Delta-E color math, state tracking with isolates...",
                key="blog_brainstorm_focus"
            )

            analyze_local_diff = st.checkbox(
                "Analyze local uncommitted changes & recent diffs",
                value=True,
                key="blog_brainstorm_analyze_diffs"
            )

            col_brainstorm, col_clear = st.columns([3, 1])
            with col_brainstorm:
                btn_ideas_disabled = (ideas_status == "running")
                if st.button("Brainstorm 5 Blog Ideas", use_container_width=True, disabled=btn_ideas_disabled, key="btn_brainstorm_blog"):
                    github_urls_to_fetch = {}
                    include_current_website = False
                    for proj_title in selected_github_projects:
                        if proj_title == "Current Website Codebase (Prateek_website)":
                            include_current_website = True
                            continue
                        for p in projects_list:
                            if p.get("title") == proj_title and p.get("githubUrl"):
                                github_urls_to_fetch[proj_title] = p.get("githubUrl")
                                break

                    def run_brainstorm():
                        context = {}
                        context['projects'] = [
                            {'title': p.get('title'), 'description': p.get('description'), 'tech': p.get('tech', [])}
                            for p in projects_list if p.get('title') in selected_github_projects
                        ]
                        if include_current_website:
                            context['projects'].append({
                                'title': "Current Website Codebase (Prateek_website)",
                                'description': "This Next.js portfolio website codebase.",
                                'tech': ["Next.js 16", "React 19", "TypeScript", "TailwindCSS", "Supabase"]
                            })
                        skills = parse_skills_file()
                        if skills:
                            context['skills'] = [s.get('name') for s in skills if s.get('name')][:15]
                        
                        if analyze_local_diff:
                            git_changes = {}
                            st_ok, st_out = run_safe_git_command(["git", "status", "--porcelain"], cwd=os.getcwd())
                            if st_ok: git_changes['touched_files'] = [l.strip() for l in st_out.splitlines() if l.strip()]
                            df_ok, df_out = run_safe_git_command(["git", "diff"], cwd=os.getcwd())
                            if df_ok and df_out.strip(): git_changes['unstaged_diff'] = df_out[:3000]
                            context['git_changes'] = git_changes

                        focus_guidance = st.session_state.get("blog_brainstorm_focus", "").strip()
                        focus_clause = f"\n[FOCUS]\nFocus on: {focus_guidance}\n" if focus_guidance else ""

                        prompt = f"""
                        You are a senior technical writer. Analyze codebase context and generate 5 blog post ideas.
                        Context: {json.dumps(context, indent=2)}
                        {focus_clause}
                        Return JSON:
                        {{
                          "ideas": [
                            {{
                              "title": "SEO-optimized title",
                              "description": "Short description",
                              "notes": "150-300 word technical notes block for generator"
                            }}
                          ]
                        }}
                        Return strictly raw JSON.
                        """
                        res = call_gemini(prompt)
                        if res is None: raise ValueError("Failed to generate ideas.")
                        return res

                    run_async_task(run_brainstorm, "blog_ideas_task")
                    st.rerun()

            with col_clear:
                if st.button("Clear Ideas", use_container_width=True, key="btn_clear_ideas"):
                    if "blog_brainstormed_ideas" in st.session_state:
                        del st.session_state.blog_brainstormed_ideas
                    st.rerun()

            brainstormed_ideas = st.session_state.get("blog_brainstormed_ideas", [])
            if brainstormed_ideas:
                st.markdown("##### Proposed Blog Ideas:")
                for idx, idea in enumerate(brainstormed_ideas):
                    with st.expander(f"💡 {idea.get('title', 'Idea ' + str(idx+1))}"):
                        st.write(idea.get('description', ''))
                        st.code(idea.get('notes', ''), language="markdown")
                        if st.button(f"👉 Load into Editor", key=f"btn_use_idea_{idx}"):
                            st.session_state.blog_draft_title = idea.get('title', '')
                            st.session_state.blog_draft_raw_notes = idea.get('notes', '')
                            st.toast(f"Loaded: {idea.get('title')} into Editor tab!")

        # ---------------------------------------------------------------------
        # ENGINE 3: ✍️ GHOSTWRITER CO-PILOT
        # ---------------------------------------------------------------------
        elif gen_mode == "✍️ Ghostwriter Co-Pilot":
            st.subheader("AI Ghostwriter Co-Pilot")
            st.write("Paste raw debug notes or reference local project files to generate standard blog posts.")

            raw_notes = st.text_area(
                "1. Paste raw notes, debug outputs, or code snippets:",
                height=150,
                placeholder="E.g. Fixed resume PDF download using jsPDF...",
                key="blog_draft_raw_notes"
            )
            local_path = st.text_input(
                "2. Reference local file/directory path relative to project root:",
                placeholder="e.g. src/components/Terminal/Terminal.tsx",
                key="blog_draft_local_path"
            )
            tone = st.selectbox("Choose Tone:", ["Professional & Technical", "Conversational & Casual", "Tutorial / How-To Style"], key="blog_draft_tone")

            blog_status = st.session_state.get("blog_draft_task_status", "idle")
            if blog_status == "success":
                res = st.session_state.get("blog_draft_task_result")
                if res:
                    st.session_state.blog_draft_title = res.get("title", "")
                    st.session_state.blog_draft_excerpt = res.get("excerpt", "")
                    st.session_state.blog_draft_content = res.get("content", "")
                    st.success("Draft generated! Switch to the '📝 Editor & SEO Audit' tab to review and publish.")
                st.session_state.blog_draft_task_status = "idle"
            elif blog_status == "error":
                err_msg = st.session_state.get("blog_draft_task_error", "Unknown error")
                st.error(f"Error generating draft: {err_msg}")
                st.session_state.blog_draft_task_status = "idle"

            if st.button("Draft Blog Post with AI", use_container_width=True, disabled=(blog_status == "running"), key="btn_draft_blog"):
                local_path_val = st.session_state.get("blog_draft_local_path", "").strip()
                if not raw_notes and not local_path_val:
                    st.error("Please add raw notes OR a local path first!")
                else:
                    path_context = ""
                    if local_path_val:
                        ok, res_context = read_local_path_context(local_path_val)
                        if not ok:
                            st.error(res_context)
                            st.stop()
                        path_context = res_context

                    context_blocks = []
                    if raw_notes: context_blocks.append(f"[RAW NOTES]\n{raw_notes}")
                    if path_context: context_blocks.append(f"[SOURCE CODE]\n{path_context}")

                    # Query Supabase System Memory Vectors
                    search_query = f"{raw_notes} {local_path_val}".strip()
                    vector_results = query_system_memory(search_query, top_k=5)
                    evidence_block = format_evidence_block(vector_results)
                    if evidence_block:
                        context_blocks.append(f"[INDEXED CODEBASE EVIDENCE (SUPABASE RAG)]\n{evidence_block}")

                    prompt = f"""
                    You are a senior full-stack developer. Write a clear developer blog post based on real codebase evidence.
                    Context: {"\n\n".join(context_blocks)}
                    Tone: {tone}
                    Return JSON:
                    {{
                      "title": "Title",
                      "excerpt": "Excerpt",
                      "content": "Markdown body"
                    }}
                    Return strictly raw JSON.
                    """
                    def run_blog_generation():
                        res = call_gemini(prompt)
                        if res is None: raise ValueError("Failed to generate draft.")
                        return res

                    run_async_task(run_blog_generation, "blog_draft_task")
                    st.rerun()

    # =========================================================================
    # TAB 2: 📝 ACTIVE EDITOR & REAL-TIME SEO AUDIT
    # =========================================================================
    with tab_edit:
        st.subheader("📝 Active Post Editor & Real-Time SEO Auditor")
        col_editor, col_seo = st.columns([1.2, 1])

        with col_editor:
            draft_title = st.text_input("Title:", key="blog_draft_title")
            draft_excerpt = st.text_area("Excerpt / Summary:", height=100, key="blog_draft_excerpt")
            draft_tags = st.text_input("Tags (comma separated):", key="blog_draft_tags")
            draft_content = st.text_area("Markdown Body Content:", height=450, key="blog_draft_content")

            dry_run_blog = st.checkbox("Dry-Run Mode (Save to Supabase/locally, skip Git remote push)", value=True, key="dry_blog")

            if st.button("🚀 Publish Blog Post Live", use_container_width=True, type="primary", key="btn_publish_main"):
                if not draft_title or not draft_content:
                    st.error("Please fill in Title and Markdown Content before publishing!")
                else:
                    try:
                        tags_parsed = [t.strip() for t in draft_tags.split(",") if t.strip()]
                        validated_title, validated_excerpt, tags_list, validated_content = validate_blog_fields(
                            draft_title, draft_excerpt, tags_parsed, draft_content
                        )
                        is_offline = st.session_state.get("offline_mode", False)
                        date_str = st.session_state.get("blog_draft_date", datetime.now().strftime('%Y-%m-%d'))
                        
                        post_payload = {
                            'title': validated_title,
                            'excerpt': validated_excerpt,
                            'tags': tags_list,
                            'content': validated_content,
                            'date': date_str,
                        }
                        ok, msg = publish_post_to_all_layers(post_payload, dry_run=dry_run_blog, is_offline=is_offline)
                        if ok:
                            st.success(msg)
                            for k in ["blog_draft_title", "blog_draft_excerpt", "blog_draft_content", "blog_draft_tags", "blog_draft_date"]:
                                if k in st.session_state: del st.session_state[k]
                            st.rerun()
                        else:
                            st.error(msg)
                    except Exception as e:
                        st.error(f"Failed to publish post: {e}")

        with col_seo:
            st.markdown("#### 🔍 Real-Time SEO Audit & Quality Score")
            focus_keyword = st.text_input("Focus Keyword:", key="blog_focus_keyword", placeholder="e.g. Next.js, RAG, Python")

            # -----------------------------------------------------------------
            # SEO Score Meter Calculation (0 - 100%)
            # -----------------------------------------------------------------
            score = 0
            title_len = len(draft_title) if draft_title else 0
            if 40 <= title_len <= 60: score += 25
            elif 30 <= title_len <= 70: score += 15

            excerpt_len = len(draft_excerpt) if draft_excerpt else 0
            if 120 <= excerpt_len <= 160: score += 20
            elif 90 <= excerpt_len <= 180: score += 10

            if focus_keyword:
                kw = focus_keyword.lower().strip()
                if draft_title and kw in draft_title.lower(): score += 20
                if draft_excerpt and kw in draft_excerpt.lower(): score += 15

                body_lower = draft_content.lower() if draft_content else ""
                kw_count = body_lower.count(kw)
                words = [w for w in body_lower.split() if w.strip()]
                word_count = len(words)
                density = (kw_count / word_count * 100) if word_count > 0 else 0
                if 1.0 <= density <= 2.5: score += 10
                elif 0.5 <= density <= 3.5: score += 5

                has_h2 = any(line.startswith('##') and kw in line for line in body_lower.split('\n'))
                if has_h2: score += 10

            score = min(score, 100)

            # Score Badge & Bar
            if score >= 80: st.markdown(f"🟢 **SEO Score:** `{score}%` (Excellent)")
            elif score >= 50: st.markdown(f"🟡 **SEO Score:** `{score}%` (Fair)")
            else: st.markdown(f"🔴 **SEO Score:** `{score}%` (Needs Improvement)")
            st.progress(score / 100)

            # Checkpoints list
            if 40 <= title_len <= 60: st.markdown(f"🟢 Title Length: {title_len} chars")
            else: st.markdown(f"🔴 Title Length: {title_len} chars (Target: 40-60)")

            if 120 <= excerpt_len <= 160: st.markdown(f"🟢 Excerpt Length: {excerpt_len} chars")
            else: st.markdown(f"🟡 Excerpt Length: {excerpt_len} chars (Target: 120-160)")

            if focus_keyword:
                kw = focus_keyword.lower().strip()
                if draft_title and kw in draft_title.lower(): st.markdown("🟢 Keyword in Title: Yes")
                else: st.markdown("🔴 Keyword in Title: No")
                if draft_excerpt and kw in draft_excerpt.lower(): st.markdown("🟢 Keyword in Excerpt: Yes")
                else: st.markdown("🔴 Keyword in Excerpt: No")

            st.markdown("---")

            # -----------------------------------------------------------------
            # 🪄 1-Click AI Auto-Optimizer
            # -----------------------------------------------------------------
            auto_seo_status = st.session_state.get("auto_seo_opt_task_status", "idle")
            if auto_seo_status == "success":
                opt_res = st.session_state.get("auto_seo_opt_task_result")
                if opt_res:
                    if opt_res.get("optimized_title"): st.session_state.blog_draft_title = opt_res["optimized_title"]
                    if opt_res.get("optimized_excerpt"): st.session_state.blog_draft_excerpt = opt_res["optimized_excerpt"]
                    st.toast("🪄 Title & Excerpt auto-optimized for 100% SEO!")
                st.session_state.auto_seo_opt_task_status = "idle"

            if st.button("🪄 AI Auto-Optimize Title & Excerpt", key="btn_auto_seo", disabled=(auto_seo_status == "running"), use_container_width=True):
                if not draft_title or not draft_content:
                    st.error("Please enter Title and Content first!")
                else:
                    opt_prompt = f"""
                    You are an expert SEO copywriter. Optimize this blog post's title and excerpt for high CTR and 100% SEO quality:
                    - Target Title length: 45 to 55 characters (MUST contain focus keyword if provided).
                    - Target Excerpt length: 130 to 155 characters (MUST contain focus keyword if provided).
                    
                    Focus Keyword: {focus_keyword or "Engineering & Architecture"}
                    Current Title: {draft_title}
                    Current Excerpt: {draft_excerpt}
                    Content Snippet: {draft_content[:800]}
                    
                    Return strictly JSON:
                    {{
                      "optimized_title": "Optimized Title 45-55 chars",
                      "optimized_excerpt": "Optimized Excerpt 130-155 chars"
                    }}
                    Return strictly raw JSON without markdown code fences.
                    """
                    def run_auto_seo():
                        res = call_gemini(opt_prompt)
                        if res is None: raise ValueError("Failed to auto-optimize SEO.")
                        return res
                    run_async_task(run_auto_seo, "auto_seo_opt_task")
                    st.rerun()

            st.markdown("---")
            seo_task_status = st.session_state.get("blog_seo_review_task_status", "idle")
            if st.button("Ask Gemini for Deep SEO Audit", key="btn_gemini_seo", disabled=(seo_task_status == "running"), use_container_width=True):
                if not draft_title or not draft_content:
                    st.error("Please fill in Title and Content first!")
                else:
                    seo_prompt = f"""
                    You are an expert SEO auditor. Analyze this post:
                    Title: {draft_title}
                    Excerpt: {draft_excerpt}
                    Focus Keyword: {focus_keyword}
                    Content: {draft_content}
                    Return JSON:
                    {{
                      "readability_grade": "Grade",
                      "meta_description": "Meta description proposal",
                      "suggested_titles": ["Alt 1", "Alt 2"],
                      "seo_recommendations": ["Rec 1", "Rec 2"]
                    }}
                    Return strictly raw JSON.
                    """
                    def run_seo_review():
                        res = call_gemini(seo_prompt)
                        if res is None: raise ValueError("Failed SEO review.")
                        return res
                    run_async_task(run_seo_review, "blog_seo_review_task")
                    st.rerun()

            if seo_task_status == "success":
                seo_res = st.session_state.get("blog_seo_review_task_result")
                if seo_res:
                    st.markdown("##### 🤖 Gemini Recommendations:")
                    st.caption(f"Readability: {seo_res.get('readability_grade')}")
                    st.code(seo_res.get('meta_description', ''), language="text")
                    for rec in seo_res.get("seo_recommendations", []):
                        st.markdown(f"- {rec}")
                st.session_state.blog_seo_review_task_status = "idle"

    # =========================================================================
    # TAB 3: 📬 PENDING DRAFTS QUEUE
    # =========================================================================
    with tab_queue:
        st.subheader("📬 Pending AI Drafts Queue (Supabase)")
        st.write("Review, polish, or 1-click approve unpublished AI drafts generated by Newsjacking or Brainstorming.")

        is_offline = st.session_state.get("offline_mode", False)
        if HAS_SYNC and not is_offline:
            try:
                draft_posts = fetch_pending_ai_drafts()
                if not draft_posts:
                    st.info("No pending AI draft posts in Supabase database.")
                else:
                    draft_filter = st.radio(
                        "Filter Drafts by Source:",
                        ["All Drafts", "🤖 Newsjacking", "💡 Codebase Brainstorm", "✍️ Ghostwriter"],
                        horizontal=True,
                        key="draft_source_filter"
                    )

                    filtered_drafts = []
                    for d in draft_posts:
                        s_type = d.get('source_type', '')
                        slug_val = d.get('slug', '').lower()
                        title_val = d.get('title', '').lower()
                        
                        if s_type == 'newsjacking' or 'gateway' in slug_val or 'openrouter' in slug_val or 'ai' in slug_val:
                            inferred_source = "🤖 Newsjacking"
                        elif s_type == 'brainstorm' or 'dev log' in title_val or 'architecting' in title_val:
                            inferred_source = "💡 Codebase Brainstorm"
                        else:
                            inferred_source = "✍️ Ghostwriter"

                        d['_inferred_source'] = inferred_source

                        if draft_filter == "All Drafts" or draft_filter == inferred_source:
                            filtered_drafts.append(d)

                    if not filtered_drafts:
                        st.warning(f"No drafts match filter '{draft_filter}'.")
                    else:
                        for draft in filtered_drafts:
                            with st.container(border=True):
                                col_info, col_load, col_approve, col_del = st.columns([3.5, 1.3, 1.5, 1])
                                raw_title = draft.get('title', 'Untitled Draft')
                                clean_title = raw_title.replace('[DRAFT]', '').strip()
                                badge = draft.get('_inferred_source', '🤖 AI Draft')

                                with col_info:
                                    st.markdown(f"**{clean_title}** `{badge}` `[DRAFT]`")
                                    st.caption(f"Slug: `{draft.get('slug')}` | Excerpt: {draft.get('excerpt', '')[:100]}...")

                                with col_load:
                                    if st.button("✏️ Load in Editor", key=f"queue_load_{draft.get('slug')}", use_container_width=True):
                                        st.session_state.blog_draft_title = clean_title
                                        st.session_state.blog_draft_excerpt = draft.get('excerpt', '')
                                        raw_tags = draft.get('tags', [])
                                        st.session_state.blog_draft_tags = ", ".join(raw_tags) if isinstance(raw_tags, list) else str(raw_tags)
                                        st.session_state.blog_draft_content = draft.get('content', '')
                                        st.session_state.blog_draft_date = draft.get('date', '')
                                        st.toast("Loaded draft into Editor tab!")

                                with col_approve:
                                    if st.button("🚀 1-Click Publish", key=f"queue_pub_{draft.get('slug')}", type="primary", use_container_width=True):
                                        ok, msg = publish_post_to_all_layers(
                                            draft, dry_run=True, old_draft_slug=draft.get('slug'), is_offline=is_offline
                                        )
                                        if ok:
                                            st.success(msg)
                                            st.rerun()
                                        else:
                                            st.error(msg)

                                with col_del:
                                    if st.button("Remove", key=f"queue_del_{draft.get('slug')}", type="secondary", use_container_width=True):
                                        ok, msg = delete_post_from_all_layers(draft.get('slug'), is_offline=is_offline)
                                        if ok:
                                            st.success(msg)
                                            st.rerun()
                                        else:
                                            st.error(msg)
            except Exception as e:
                st.error(f"Failed to fetch drafts: {e}")
        else:
            st.caption("Offline mode active — Supabase database drafts unavailable.")

    # =========================================================================
    # TAB 4: 📚 PUBLISHED LIBRARY
    # =========================================================================
    with tab_pub:
        st.subheader("📚 Published Blog Library")
        st.write("Manage already published blog posts on your portfolio website.")

        posts_dir = os.path.join("src", "content", "posts")
        if os.path.exists(posts_dir):
            post_files = [f for f in os.listdir(posts_dir) if f.endswith(".md")]
            if not post_files:
                st.info("No published blog posts found on website.")
            else:
                posts_data = []
                for file_name in post_files:
                    file_path = os.path.join(posts_dir, file_name)
                    p_title = file_name
                    p_date = ""
                    p_excerpt = ""
                    p_tags = []
                    p_body = ""
                    try:
                        with open(file_path, "r", encoding="utf-8") as f: file_content = f.read()
                        p_body = file_content
                        if file_content.startswith("---"):
                            parts = file_content.split("---", 2)
                            if len(parts) >= 3:
                                frontmatter = parts[1]
                                p_body = parts[2].strip()
                                for line in frontmatter.split("\n"):
                                    line = line.strip()
                                    if line.startswith("title:"): p_title = line.split("title:", 1)[1].strip().strip('"').strip("'")
                                    elif line.startswith("date:"): p_date = line.split("date:", 1)[1].strip().strip('"').strip("'")
                                    elif line.startswith("excerpt:"): p_excerpt = line.split("excerpt:", 1)[1].strip().strip('"').strip("'")
                                    elif line.startswith("tags:"):
                                        t_str = line.split("tags:", 1)[1].strip()
                                        try: p_tags = json.loads(t_str)
                                        except Exception: p_tags = [t.strip() for t in t_str.replace("[", "").replace("]", "").replace('"', '').replace("'", "").split(",") if t.strip()]
                    except Exception:
                        pass
                    posts_data.append({
                        "file_name": file_name,
                        "file_path": file_path,
                        "title": p_title,
                        "date": p_date,
                        "excerpt": p_excerpt,
                        "tags": p_tags,
                        "body": p_body
                    })

                posts_data.sort(key=lambda x: x["date"] or "0000-00-00", reverse=True)

                search_query = st.text_input("🔍 Search published posts:", placeholder="Type to filter titles...", key="search_pub_posts")
                if search_query.strip():
                    q = search_query.lower().strip()
                    posts_data = [p for p in posts_data if q in p['title'].lower() or q in p['file_name'].lower()]

                for post in posts_data:
                    with st.container(border=True):
                        col_info, col_edit, col_del, col_link = st.columns([4, 1, 1, 1])
                        with col_info:
                            st.markdown(f"**{post['title']}**")
                            st.caption(f"Date: {post['date'] or 'No Date'} | File: `{post['file_name']}`")

                        with col_edit:
                            if st.button("Edit", key=f"pub_edit_{post['file_name']}", type="secondary", use_container_width=True):
                                st.session_state.blog_draft_title = post['title']
                                st.session_state.blog_draft_excerpt = post['excerpt']
                                st.session_state.blog_draft_tags = ", ".join(post['tags'])
                                st.session_state.blog_draft_content = post['body']
                                st.session_state.blog_draft_date = post['date']
                                st.toast("Loaded post into Editor tab!")

                        with col_del:
                            if st.button("Remove", key=f"pub_del_{post['file_name']}", type="secondary", use_container_width=True):
                                is_offline = st.session_state.get("offline_mode", False)
                                ok, msg = delete_post_from_all_layers(post['file_name'], is_offline=is_offline)
                                if ok:
                                    st.success(msg)
                                    st.rerun()
                                else:
                                    st.error(msg)

                        with col_link:
                            clean_slug = post['file_name'].replace(".md", "")
                            st.markdown(f"[🔗 View](https://prateeq.in/blog/{clean_slug})")
        else:
            st.info("No blog posts directory found.")
