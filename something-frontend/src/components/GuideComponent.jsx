import React, { useRef } from "react";
import "../styles/guide.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import dash from "../photos/dash.jpg";
import join from "../photos/join.jpg";
import req from "../photos/req.jpg";
import roomChat from "../photos/roomchat.jpg";
import subj from "../photos/subj.jpg";
import profile from "../photos/profile.jpg";
import actionBtns from "../photos/actionbtns.jpg";
import edit from "../photos/edit.jpg";
import logo from "../photos/logo2.png";

export default function GuideComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sections = {
    overview: useRef(null),
    dashboard: useRef(null),
    rooms: useRef(null),
    actions: useRef(null),
    roles: useRef(null),
    interaction: useRef(null),
    account: useRef(null),
    navigation: useRef(null),
    quickstart: useRef(null),
    contact: useRef(null)
  };

  const scrollTo = (key) => {
    sections[key]?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const overviewBullets = t("guide.sections.overview.bullets", { returnObjects: true });
  const dashboardSteps = t("guide.sections.dashboard.steps", { returnObjects: true });
  const actionsBullets = t("guide.sections.actions.bullets", { returnObjects: true });
  const roomsBullets = t("guide.sections.rooms.bullets", { returnObjects: true });
  const rolesBullets = t("guide.sections.roles.bullets", { returnObjects: true });
  const interactionLines = t("guide.sections.interaction.lines", { returnObjects: true });
  const navigationBullets = t("guide.sections.navigation.bullets", { returnObjects: true });
  const quickstartSteps = t("guide.sections.quickstart.steps", { returnObjects: true });

  return (
    <div className="guide-container">
      <aside className="guide-nav">
        <h2>{t("guide.sidebar.title")}</h2>
        <ul>
          <li
            style={{ backgroundColor: "#0859d38d", borderColor: "#08d3d38d" }}
            onClick={() => navigate("/dashboard")}
          >
            {t("guide.back")}
          </li>
          <li onClick={() => scrollTo("overview")}>{t("guide.nav.overview")}</li>
          <li onClick={() => scrollTo("dashboard")}>{t("guide.nav.dashboard")}</li>
          <li onClick={() => scrollTo("rooms")}>{t("guide.nav.rooms")}</li>
          <li onClick={() => scrollTo("actions")}>{t("guide.nav.actions")}</li>
          <li onClick={() => scrollTo("roles")}>{t("guide.nav.roles")}</li>
          <li onClick={() => scrollTo("interaction")}>{t("guide.nav.interaction")}</li>
          <li onClick={() => scrollTo("account")}>{t("guide.nav.account")}</li>
          <li onClick={() => scrollTo("navigation")}>{t("guide.nav.navigation")}</li>
          <li onClick={() => scrollTo("quickstart")}>{t("guide.nav.quickstart")}</li>
          <li onClick={() => scrollTo("contact")}>{t("guide.nav.contact")}</li>
        </ul>
      </aside>

      <main className="guide-content">
        <div className="guideHeader">
          <img src={logo} alt={t("guide.logoAlt")} className="guideLogo" />
          <p className="guide-quote">{t("guide.quote")}</p>
        </div>

        <section ref={sections.overview}>
          <h1>{t("guide.sections.overview.title")}</h1>
          <p>{t("guide.sections.overview.text1")}</p>
          <ul>
            {overviewBullets.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section ref={sections.dashboard}>
          <h1>{t("guide.sections.dashboard.title")}</h1>
          <p>{t("guide.sections.dashboard.text1")}</p>
          <ol>
            {dashboardSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <img src={dash} alt={t("guide.sections.dashboard.imageAlt")} />
        </section>

        <section ref={sections.actions}>
          <h1>{t("guide.sections.actions.title")}</h1>
          <p>{t("guide.sections.actions.text1")}</p>
          <ul>
            {actionsBullets.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <img src={profile} alt={t("guide.sections.actions.profileAlt")} />
          <p>{t("guide.sections.actions.text2")}</p>
          <p>{t("guide.sections.actions.text3")}</p>
          <img src={actionBtns} alt={t("guide.sections.actions.sidebarAlt")} />
        </section>

        <section ref={sections.rooms}>
          <h1>{t("guide.sections.rooms.title")}</h1>
          <p>{t("guide.sections.rooms.text1")}</p>
          <ul>
            {roomsBullets.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <img src={join} alt={t("guide.sections.rooms.joinAlt")} />
          <img src={req} alt={t("guide.sections.rooms.requestAlt")} />
          <img src={roomChat} alt={t("guide.sections.rooms.chatAlt")} />
          <img src={subj} alt={t("guide.sections.rooms.subjectAlt")} />
        </section>

        <section ref={sections.roles}>
          <h1>{t("guide.sections.roles.title")}</h1>
          <p>{t("guide.sections.roles.text1")}</p>
          <ul>
            {rolesBullets.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section ref={sections.interaction}>
          <h1>{t("guide.sections.interaction.title")}</h1>
          {interactionLines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </section>

        <section ref={sections.account}>
          <h1>{t("guide.sections.account.title")}</h1>
          <p>{t("guide.sections.account.text1")}</p>
          <img src={edit} alt={t("guide.sections.account.imageAlt")} />
        </section>

        <section ref={sections.navigation}>
          <h1>{t("guide.sections.navigation.title")}</h1>
          <ul>
            {navigationBullets.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section ref={sections.quickstart}>
          <h1>{t("guide.sections.quickstart.title")}</h1>
          <ol>
            {quickstartSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>

        <section ref={sections.contact}>
          <h1>{t("guide.sections.contact.title")}</h1>
          <p>
            <strong>{t("guide.sections.contact.studyBuddyLabel")}</strong>
            <a className="mail" href={`mailto:${t("guide.sections.contact.studyBuddyEmail")}`}>
              {t("guide.sections.contact.studyBuddyEmail")}
            </a>
          </p>
          <p>
            <strong>{t("guide.sections.contact.superAdmin1Label")}</strong>
            <a className="mail" href={`mailto:${t("guide.sections.contact.superAdmin1Email")}`}>
              {t("guide.sections.contact.superAdmin1Email")}
            </a>
          </p>
          <p>
            <strong>{t("guide.sections.contact.superAdmin2Label")}</strong>
            <a className="mail" href={`mailto:${t("guide.sections.contact.superAdmin2Email")}`}>
              {t("guide.sections.contact.superAdmin2Email")}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
