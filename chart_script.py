import plotly.graph_objects as go
import plotly.express as px
import numpy as np

# Define the system architecture components with better hierarchical positioning
components = {
    "User Interface": {"x": 1, "y": 3, "type": "Frontend", "color": "#1FB8CD"},
    "API Gateway": {"x": 2.5, "y": 4, "type": "Backend", "color": "#DB4545"},
    "Auth Service": {"x": 2.5, "y": 2, "type": "Backend", "color": "#DB4545"},
    "Agentic Engine": {"x": 4, "y": 3.5, "type": "AI System", "color": "#2E8B57"},
    "Knowledge Base": {"x": 5.5, "y": 4.5, "type": "Storage", "color": "#5D878F"},
    "Database": {"x": 5.5, "y": 2.5, "type": "Storage", "color": "#5D878F"},
    "Real-time Hub": {"x": 2.5, "y": 0.5, "type": "Communication", "color": "#D2BA4C"},
    "External APIs": {"x": 6.5, "y": 3.5, "type": "Integrations", "color": "#B4413C"}
}

# Create the main figure
fig = go.Figure()

# Add component nodes with better sizing and text
for name, props in components.items():
    # Determine if this is the first occurrence of this type for legend
    show_legend = name == next(n for n, p in components.items() if p["type"] == props["type"])
    
    fig.add_trace(go.Scatter(
        x=[props["x"]], 
        y=[props["y"]], 
        mode='markers+text',
        marker=dict(size=100, color=props["color"], line=dict(width=3, color='white')),
        text=[name.replace(" ", "<br>")],
        textposition="middle center",
        textfont=dict(size=12, color='white', family="Arial Black"),
        name=props["type"],
        hovertemplate=f"<b>{name}</b><br>Type: {props['type']}<br><extra></extra>",
        showlegend=show_legend
    ))

# Define connections with better flow representation
connections = [
    ("User Interface", "API Gateway", "Requests"),
    ("User Interface", "Auth Service", "Login"),
    ("API Gateway", "Agentic Engine", "Tickets"),
    ("API Gateway", "Database", "Data"),
    ("Agentic Engine", "Knowledge Base", "Search"),
    ("Agentic Engine", "External APIs", "AI Calls"),
    ("Agentic Engine", "Database", "Suggestions"),
    ("Real-time Hub", "User Interface", "Updates"),
    ("API Gateway", "Real-time Hub", "Events")
]

# Add connection lines with improved routing
for start, end, label in connections:
    start_pos = components[start]
    end_pos = components[end]
    
    # Add slight curve to avoid overlapping lines
    mid_x = (start_pos["x"] + end_pos["x"]) / 2
    mid_y = (start_pos["y"] + end_pos["y"]) / 2
    
    fig.add_trace(go.Scatter(
        x=[start_pos["x"], mid_x, end_pos["x"]],
        y=[start_pos["y"], mid_y, end_pos["y"]],
        mode='lines',
        line=dict(color='#666666', width=2),
        showlegend=False,
        hoverinfo='skip'
    ))
    
    # Add directional arrow
    dx = end_pos["x"] - start_pos["x"]
    dy = end_pos["y"] - start_pos["y"]
    length = np.sqrt(dx**2 + dy**2)
    
    # Position arrow closer to end point
    arrow_x = end_pos["x"] - 0.15 * (dx / length)
    arrow_y = end_pos["y"] - 0.15 * (dy / length)
    
    fig.add_trace(go.Scatter(
        x=[arrow_x],
        y=[arrow_y],
        mode='markers',
        marker=dict(symbol='triangle-right', size=10, color='#666666'),
        showlegend=False,
        hoverinfo='skip'
    ))

# Add workflow steps annotation for Agentic Engine
workflow_steps = ["Plan", "Classify", "Retrieve", "Draft", "Decide"]
fig.add_trace(go.Scatter(
    x=[4, 4.1, 4.2, 4.1, 4],
    y=[3.2, 3.1, 3.3, 3.7, 3.8],
    mode='markers+text',
    marker=dict(size=25, color='#2E8B57', opacity=0.7),
    text=workflow_steps,
    textposition="middle center",
    textfont=dict(size=8, color='white'),
    showlegend=False,
    hovertemplate="Workflow Step: %{text}<extra></extra>"
))

# Add system boundaries/groupings with rectangles
fig.add_shape(
    type="rect",
    x0=0.5, y0=-0.5, x1=1.5, y1=3.5,
    line=dict(color="#1FB8CD", width=2, dash="dash"),
    fillcolor="rgba(31,184,205,0.1)"
)

fig.add_shape(
    type="rect",
    x0=2, y0=-0.5, x1=3, y1=4.5,
    line=dict(color="#DB4545", width=2, dash="dash"),
    fillcolor="rgba(219,69,69,0.1)"
)

fig.add_shape(
    type="rect",
    x0=3.5, y0=2.8, x1=4.5, y1=4.2,
    line=dict(color="#2E8B57", width=2, dash="dash"),
    fillcolor="rgba(46,139,87,0.1)"
)

fig.add_shape(
    type="rect",
    x0=5, y0=2, x1=6, y1=5,
    line=dict(color="#5D878F", width=2, dash="dash"),
    fillcolor="rgba(93,135,143,0.1)"
)

# Update layout
fig.update_layout(
    title="Smart Helpdesk Agentic Triage System",
    xaxis=dict(
        showgrid=False,
        zeroline=False,
        showticklabels=False,
        range=[0, 7]
    ),
    yaxis=dict(
        showgrid=False,
        zeroline=False,
        showticklabels=False,
        range=[-1, 5]
    ),
    plot_bgcolor='rgba(0,0,0,0)',
    legend=dict(
        orientation='h',
        yanchor='bottom',
        y=1.05,
        xanchor='center',
        x=0.5
    )
)

# Save the chart
fig.write_image("smart_helpdesk_architecture.png")