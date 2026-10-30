# Datos de DEMOSTRACIÓN (ficticios) para grabar el reel. No usa la lista real de invitados.
import random, time, json
random.seed(7)
now = int(time.time() * 1000)
H = 3600_000
groups = [
  ("Laura Gómez", "Amigos", ["Laura Gómez", "Andrés Pineda"]),
  ("Familia Restrepo", "Familia", ["Camilo Restrepo", "Paula Restrepo", "Tomás Restrepo (niño)"]),
  ("Valeria Ortiz", "Amigos", ["Valeria Ortiz"]),
  ("Tía Carmen", "Familia", ["Carmen Lucía Peña", "Rafael Peña"]),
  ("Sebastián Mora", "Trabajo", ["Sebastián Mora", "Daniela Ríos"]),
  ("Familia Castaño", "Familia", ["Jorge Castaño", "Marta Castaño", "Sofía Castaño", "Juan Castaño"]),
  ("Natalia Herrera", "Amigos", ["Natalia Herrera", "Felipe Duarte"]),
  ("Abuela Rosa", "Familia", ["Rosa Elena Díaz"]),
  ("Mauricio Vargas", "Trabajo", ["Mauricio Vargas"]),
  ("Primos Salazar", "Familia", ["Diego Salazar", "Ana María Salazar", "Lucas Salazar"]),
  ("Catalina Rueda", "Amigos", ["Catalina Rueda", "Esteban Rueda"]),
  ("Familia Quintero", "Familia", ["Hernán Quintero", "Gloria Quintero", "Mateo Quintero"]),
  ("Juliana Ospina", "Amigos", ["Juliana Ospina"]),
  ("Andrés Cárdenas", "Trabajo", ["Andrés Cárdenas", "Lina Cárdenas"]),
  ("Tío Fernando", "Familia", ["Fernando Ruiz", "Patricia Ruiz"]),
  ("María José León", "Amigos", ["María José León", "Simón Arango"]),
  ("Familia Bermúdez", "Familia", ["Óscar Bermúdez", "Claudia Bermúdez", "Isabella Bermúdez", "Samuel Bermúdez"]),
  ("Daniel Acosta", "Amigos", ["Daniel Acosta"]),
  ("Carolina Mejía", "Trabajo", ["Carolina Mejía", "Iván Torres"]),
  ("Padrinos Londoño", "Familia", ["Ricardo Londoño", "Beatriz Londoño"]),
  ("Santiago Patiño", "Amigos", ["Santiago Patiño", "Mariana Gil"]),
  ("Familia Cifuentes", "Familia", ["Luis Cifuentes", "Teresa Cifuentes", "Emilia Cifuentes"]),
  ("Alejandra Rojas", "Amigos", ["Alejandra Rojas"]),
  ("Nicolás Franco", "Trabajo", ["Nicolás Franco", "Paola Franco"]),
  ("Primas Zuluaga", "Familia", ["Verónica Zuluaga", "Manuela Zuluaga"]),
  ("Gabriel Montoya", "Amigos", ["Gabriel Montoya", "Lorena Pardo"]),
  ("Familia Escobar", "Familia", ["Alberto Escobar", "Cecilia Escobar", "Martín Escobar"]),
  ("Isabel Cristina Vélez", "Amigos", ["Isabel Cristina Vélez", "Mauricio Lara"]),
  ("Jaime Arbeláez", "Trabajo", ["Jaime Arbeláez"]),
  ("Familia Navarro", "Familia", ["Rodrigo Navarro", "Liliana Navarro", "Antonia Navarro"]),
  ("Melissa Cuervo", "Amigos", ["Melissa Cuervo", "Kevin Santos"]),
  ("Tía Olga", "Familia", ["Olga Beltrán"]),
  ("Felipe Cano", "Amigos", ["Felipe Cano", "Sara Jiménez"]),
  ("Familia Ramírez", "Familia", ["Germán Ramírez", "Nubia Ramírez", "Camila Ramírez", "David Ramírez"]),
  ("Diana Marcela Soto", "Trabajo", ["Diana Marcela Soto", "Jhon Soto"]),
  ("Ángela Pérez", "Amigos", ["Ángela Pérez", "Ricardo Mesa"]),
]
msgs = ["¡Qué alegría! Allá estaremos con todo el cariño 💛", "No nos lo perdemos por nada. ¡Felicitaciones!", "Gracias por invitarnos, ya tenemos el outfit verde salvia 🌿",
        "¡Por fin! Los queremos mucho.", "Contamos los días para celebrar con ustedes ✨"]
notes = ["Confirmar si llevan a los niños a la recepción.", "Llamar para pedir el teléfono de la abuela.", "Prefieren mesa cerca de la pista 💃", "Son padrinos: ubicarlos cerca de la mesa de novios."]
q = lambda v: "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"
out = ["DELETE FROM activities; DELETE FROM chat_messages; DELETE FROM guests; DELETE FROM invitations; DELETE FROM floor_plans; DELETE FROM login_attempts;"]
for k, (name, cat, people) in enumerate(groups):
    code = "demo-" + "".join(c for c in name.lower().replace(" ", "-") if c.isalnum() or c == "-")[:20]
    r = random.random()
    stage = "pend" if k >= 30 else ("yes" if r < .45 else "no" if r < .5 else "seen" if r < .75 else "sent")
    if name == "Laura Gómez": stage = "fresh"
    sent = None if stage in ("pend", "fresh") else now - random.randint(30, 140) * H
    opened = None if stage in ("pend", "sent", "fresh") else sent + random.randint(1, 20) * H
    rsvp = "yes" if stage == "yes" else "no" if stage == "no" else "pending"
    att = len(people) - (1 if (rsvp == "yes" and len(people) > 3 and random.random() < .5) else 0) if rsvp == "yes" else (0 if rsvp == "no" else None)
    msg = random.choice(msgs) if rsvp == "yes" and random.random() < .6 else None
    rsvp_at = opened + random.randint(1, 10) * H if rsvp != "pending" else None
    phone = "300" + str(random.randint(1000000, 9999999))
    tags = "Padrinos" if "Padrinos" in name else ""
    out.append(f"INSERT INTO invitations (code,name,category,seats,phone,tags,source,sent_at,sent_count,first_opened_at,last_opened_at,open_count,rsvp_status,rsvp_attending,rsvp_message,rsvp_at,created_at,updated_at) VALUES ({q(code)},{q(name)},{q(cat)},{len(people)},{q(phone)},{q(tags)},'admin',{q(sent)},{1 if sent else 0},{q(opened)},{q(opened)},{random.randint(1,4) if opened else 0},{q(rsvp)},{q(att)},{q(msg)},{q(rsvp_at)},{now-200*H},{now-H})")
    inv = f"(SELECT id FROM invitations WHERE code={q(code)})"
    for p in people:
        child = "(niño)" in p
        out.append(f"INSERT INTO guests (invitation_id,name,relation,is_child,attending) VALUES ({inv},{q(p.replace(' (niño)', ''))},'',{1 if child else 0},{('1' if rsvp=='yes' else '0') if rsvp!='pending' else 'NULL'})")
    acts = [(now - 200 * H, "created", "sistema", "Invitación creada desde el backoffice.")]
    if sent: acts.append((sent, "sent", "Equipo", "Invitación enviada por WhatsApp."))
    if opened: acts.append((opened, "open", name, "Abrió la invitación por primera vez."))
    if rsvp == "yes": acts.append((rsvp_at, "rsvp", name, f"Confirmó asistencia · {att} de {len(people)} cupo(s)."))
    if rsvp == "no": acts.append((rsvp_at, "rsvp", name, "No podrá asistir."))
    if msg: acts.append((rsvp_at + 1000, "message", name, msg))
    if k in (1, 5, 19, 26): acts.append((now - random.randint(2, 30) * H, "note", "Norida", notes[[1, 5, 19, 26].index(k)]))
    for at, typ, author, body in acts:
        out.append(f"INSERT INTO activities (invitation_id,type,author,body,pinned,created_at) VALUES ({inv},{q(typ)},{q(author)},{q(body)},0,{at})")
open("demo-seed.sql", "w").write(";\n".join(out) + ";\n")
print(len(groups), "invitaciones", sum(len(g[2]) for g in groups), "personas")
