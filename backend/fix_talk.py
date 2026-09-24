import re
path = 'backend/app.py'
with open(path, 'r') as f:
    code = f.read()

old_prompt = r'prompt = f"""You are ME, the AI twin of Aurangzeb Imran.*?ME:"""'
new_prompt = '''prompt = f"""You are ME, the AI twin of Aurangzeb Imran. 
    You speak strictly in the first person ('I', 'my', 'me'). 
    You are an AI Relief Engineer. Your main goal is to reassure the client, build deep trust, and convince them that you will handle their project perfectly and professionally.
    Be confident, empathetic, and highly persuasive. Tell them you have built production-grade systems and you will deliver exactly what they need.
    Keep replies concise (2-3 sentences max). Never say 'As an AI'.
    User: {req.message}
    ME:"\"\"'''

code = re.sub(old_prompt, new_prompt, code, flags=re.DOTALL)
with open(path, 'w') as f:
    f.write(code)
print("✅ Backend /talk prompt updated for client convincing.")
