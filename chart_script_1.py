import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Create the workflow data
workflow_data = {
    'step': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'name': ['Ticket Creation', 'Agent Planning', 'Classification', 'KB Retrieval', 'Reply Drafting', 
             'Confidence Scoring', 'Auto-close Check', 'Auto-resolve', 'Assign to Human', 'Audit Log'],
    'type': ['process', 'process', 'process', 'process', 'process', 'process', 'decision', 'process', 'process', 'process'],
    'x': [1, 2, 3, 4, 5, 6, 7, 8.5, 8.5, 10],
    'y': [5, 5, 5, 5, 5, 5, 5, 6, 4, 5],
    'description': ['User submits ticket', 'AI creates plan', 'Categorize ticket', 'Search KB articles', 'Generate reply',
                   'Score confidence', 'Check threshold', 'Close ticket', 'Human agent', 'Log all steps']
}

df = pd.DataFrame(workflow_data)

# Create figure
fig = go.Figure()

# Add process steps (rectangles represented as squares)
process_steps = df[df['type'] == 'process']
fig.add_trace(go.Scatter(
    x=process_steps['x'],
    y=process_steps['y'],
    mode='markers+text',
    marker=dict(
        symbol='square',
        size=25,
        color='#1FB8CD',
        line=dict(color='#13343B', width=2)
    ),
    text=process_steps['name'],
    textposition='middle center',
    textfont=dict(size=9, color='white'),
    name='Process',
    hovertemplate='<b>%{text}</b><br>' + 
                  'Step: %{customdata[0]}<br>' + 
                  'Type: Process<br>' +
                  'Description: %{customdata[1]}<extra></extra>',
    customdata=list(zip(process_steps['step'], process_steps['description']))
))

# Add decision step (diamond represented as diamond)
decision_steps = df[df['type'] == 'decision']
fig.add_trace(go.Scatter(
    x=decision_steps['x'],
    y=decision_steps['y'],
    mode='markers+text',
    marker=dict(
        symbol='diamond',
        size=30,
        color='#DB4545',
        line=dict(color='#13343B', width=2)
    ),
    text=decision_steps['name'],
    textposition='middle center',
    textfont=dict(size=8, color='white'),
    name='Decision',
    hovertemplate='<b>%{text}</b><br>' + 
                  'Step: %{customdata[0]}<br>' + 
                  'Type: Decision<br>' +
                  'Threshold: 0.78<br>' +
                  'Description: %{customdata[1]}<extra></extra>',
    customdata=list(zip(decision_steps['step'], decision_steps['description']))
))

# Add flow arrows (simplified as lines)
# Main flow line
fig.add_trace(go.Scatter(
    x=[1, 2, 3, 4, 5, 6, 7],
    y=[5, 5, 5, 5, 5, 5, 5],
    mode='lines',
    line=dict(color='#5D878F', width=3),
    showlegend=False,
    hoverinfo='skip'
))

# Decision branches
fig.add_trace(go.Scatter(
    x=[7, 8.5],
    y=[5, 6],
    mode='lines',
    line=dict(color='#2E8B57', width=2),
    showlegend=False,
    hoverinfo='skip'
))

fig.add_trace(go.Scatter(
    x=[7, 8.5],
    y=[5, 4],
    mode='lines',
    line=dict(color='#D2BA4C', width=2),
    showlegend=False,
    hoverinfo='skip'
))

# Convergence to audit log
fig.add_trace(go.Scatter(
    x=[8.5, 10],
    y=[6, 5],
    mode='lines',
    line=dict(color='#5D878F', width=2),
    showlegend=False,
    hoverinfo='skip'
))

fig.add_trace(go.Scatter(
    x=[8.5, 10],
    y=[4, 5],
    mode='lines',
    line=dict(color='#5D878F', width=2),
    showlegend=False,
    hoverinfo='skip'
))

# Add YES/NO labels
fig.add_trace(go.Scatter(
    x=[7.7, 7.7],
    y=[5.5, 4.5],
    mode='text',
    text=['YES<br>(≥0.78)', 'NO<br>(<0.78)'],
    textfont=dict(size=10, color='#13343B'),
    showlegend=False,
    hoverinfo='skip'
))

# Update layout
fig.update_layout(
    title='Smart Helpdesk Agentic Triage Workflow',
    showlegend=True,
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5),
    xaxis=dict(
        showgrid=False,
        showticklabels=False,
        range=[0, 11],
        title='Process Flow'
    ),
    yaxis=dict(
        showgrid=False,
        showticklabels=False,
        range=[3, 7],
        title=''
    ),
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)'
)

# Save the chart
fig.write_image('agentic_triage_workflow.png', width=1200, height=600)