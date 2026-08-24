from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Patch

OUTPUT = Path("docs/audit-assets/final-audit-metrics.png")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

plt.style.use("seaborn-v0_8-whitegrid")
fig, axes = plt.subplots(2, 2, figsize=(15, 8), constrained_layout=True)
fig.patch.set_facecolor("#f8fafc")
fig.suptitle("NYSC Security Branch — Final Quality Metrics", fontsize=18, fontweight="bold", color="#0f172a")

# The final audit runner has eleven checks; all exited zero.
checks = ["Dependency\naudit", "TypeScript", "Diff\ncheck", "Production\nbuild", "E2E\nauth", "E2E\nauthz", "Policy", "Business\nflows", "Responsive\nsmoke", "Role\nsmoke", "Security\nbaseline"]
axes[0, 0].bar(range(len(checks)), [1] * len(checks), color="#16a34a", width=0.72)
axes[0, 0].set_ylim(0, 1.15)
axes[0, 0].set_yticks([0, 1], ["Fail", "Pass"])
axes[0, 0].set_xticks(range(len(checks)), checks, fontsize=7, rotation=28, ha="right")
axes[0, 0].set_title("Local validation checks: 11 / 11 passed", loc="left", fontweight="bold")
axes[0, 0].text(5, 1.04, "100%", ha="center", va="bottom", fontsize=14, fontweight="bold", color="#166534")

# Eight evidence rows in SECURITY_AUDIT_SUPPLEMENT.md, grouped by disposition.
security_labels = ["Fixed / hardened", "No immediate finding", "Not applicable"]
security_values = [4, 3, 1]
security_colors = ["#16a34a", "#0ea5e9", "#94a3b8"]
axes[0, 1].barh(security_labels, security_values, color=security_colors)
axes[0, 1].set_xlim(0, 4.7)
axes[0, 1].set_xlabel("Evidence rows")
axes[0, 1].set_title("Application security review disposition", loc="left", fontweight="bold")
for i, value in enumerate(security_values):
    axes[0, 1].text(value + 0.08, i, str(value), va="center", fontweight="bold")

# Provider WAF is intentionally separated from application controls.
waf_labels = ["Documented WAF rules", "Provider-configured rules", "Provider rules pending"]
waf_values = [8, 0, 8]
waf_colors = ["#2563eb", "#16a34a", "#f59e0b"]
axes[1, 0].bar(waf_labels, waf_values, color=waf_colors, width=0.62)
axes[1, 0].set_ylim(0, 8.8)
axes[1, 0].set_ylabel("Rule count")
axes[1, 0].set_title("Vercel WAF coverage (actual provider state)", loc="left", fontweight="bold")
axes[1, 0].tick_params(axis="x", labelrotation=18, labelsize=8)
for i, value in enumerate(waf_values):
    axes[1, 0].text(i, value + 0.18, str(value), ha="center", fontweight="bold")

# CDP viewport smoke test covered six entry routes, all without horizontal overflow.
mobile_labels = ["Routes tested", "No-overflow routes"]
mobile_values = [6, 6]
axes[1, 1].bar(mobile_labels, mobile_values, color=["#64748b", "#16a34a"], width=0.55)
axes[1, 1].set_ylim(0, 6.8)
axes[1, 1].set_ylabel("Route count")
axes[1, 1].set_title("375×812 responsive smoke test", loc="left", fontweight="bold")
for i, value in enumerate(mobile_values):
    axes[1, 1].text(i, value + 0.15, str(value), ha="center", fontweight="bold")
axes[1, 1].text(0.5, 5.15, "100% no horizontal overflow", ha="center", color="#166534", fontweight="bold")

for axis in axes.flat:
    axis.set_facecolor("#ffffff")
    axis.spines["top"].set_visible(False)
    axis.spines["right"].set_visible(False)
    axis.grid(axis="y", color="#e2e8f0", linewidth=0.8)
    axis.tick_params(colors="#475569")
    axis.title.set_color("#0f172a")
    axis.xaxis.label.set_color("#475569")
    axis.yaxis.label.set_color("#475569")

fig.savefig(OUTPUT, dpi=180, facecolor=fig.get_facecolor())
print(OUTPUT)
