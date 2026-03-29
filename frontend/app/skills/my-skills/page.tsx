"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import Loader from "@/components/loader/Loader";

type UserSkill = { id: number; skill_id: number; skill_name: string; proficiency_level: string };
type Skill = { skill_id: number; skill_name: string };

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function MySkillsPage() {
	const { user, loading } = useAuth();
	const { showToast } = useToast();
	const router = useRouter();

	const [skills, setSkills] = useState<UserSkill[]>([]);
	const [allSkills, setAllSkills] = useState<Skill[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);

	// Add/edit form state
	const [selectedSkillId, setSelectedSkillId] = useState("");
	const [newSkillName, setNewSkillName] = useState("");
	const [proficiency, setProficiency] = useState("Beginner");
	const [isNewSkill, setIsNewSkill] = useState(false);
	const [dataLoading, setDataLoading] = useState(true);

	useEffect(() => {
		if (!loading && !user) router.replace("/login");
	}, [user, loading, router]);

	async function fetchSkills() {
		if (!user) return;
		try {
			const data = await apiGet(`/user-skills/${user.user_id}`);
			setSkills(data);
		} catch {
			/* empty */
		}
	}

	async function fetchAllSkills() {
		try {
			const data = await apiGet("/skills");
			setAllSkills(data);
		} catch {
			/* empty */
		}
	}

	useEffect(() => {
		if (user) {
			setDataLoading(true);
			Promise.allSettled([fetchSkills(), fetchAllSkills()]).finally(() =>
				setDataLoading(false),
			);
		}
	}, [user]);

	function openAddModal() {
		setEditingSkill(null);
		setSelectedSkillId("");
		setNewSkillName("");
		setProficiency("Beginner");
		setIsNewSkill(false);
		setShowModal(true);
	}

	function openEditModal(skill: UserSkill) {
		setEditingSkill(skill);
		setProficiency(skill.proficiency_level);
		setShowModal(true);
	}

	async function handleSave() {
		if (!user) return;
		try {
			if (editingSkill) {
				await apiPut(`/user-skill/${editingSkill.id}`, { proficiency_level: proficiency });
				showToast("Skill updated!", "success");
			} else {
				let skillId = Number(selectedSkillId);
				if (isNewSkill && newSkillName) {
					const created = await apiPost("/add-new-skill", { skill_name: newSkillName });
					skillId = created.skill_id;
					fetchAllSkills();
				}
				if (!skillId) {
					showToast("Please select or enter a skill", "error");
					return;
				}
				await apiPost("/add-skill", {
					user_id: user.user_id,
					skill_id: skillId,
					proficiency,
				});
				showToast("Skill added!", "success");
			}
			setShowModal(false);
			fetchSkills();
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Failed to save skill", "error");
		}
	}

	async function handleDelete(skill: UserSkill) {
		if (!confirm(`Remove "${skill.skill_name}"?`)) return;
		try {
			await apiDelete(`/user-skill/${skill.id}`);
			showToast("Skill removed", "success");
			fetchSkills();
		} catch (err) {
			showToast(err instanceof ApiError ? err.message : "Failed to delete", "error");
		}
	}

	if (loading || (user && dataLoading)) {
		return (
			<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="page-container">
			<div className="page-header flex items-center justify-between">
				<div>
					<h1>My Skills</h1>
					<p>Skills you offer to teach others</p>
				</div>
				<button onClick={openAddModal}>+ Add Skill</button>
			</div>

			{skills.length === 0 ? (
				<div className="empty-state card">
					<p>You haven&apos;t added any skills yet.</p>
					<button onClick={openAddModal} className="mt-4">
						Add Your First Skill
					</button>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{skills.map((s) => (
						<div key={s.id} className="card flex flex-col gap-3">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="text-base font-semibold text-slate-800">
										{s.skill_name}
									</h3>
									<span className="badge badge-teal mt-1">
										{s.proficiency_level}
									</span>
								</div>
							</div>
							<div className="flex gap-2">
								<button
									className="btn-secondary btn-sm flex-1"
									onClick={() => openEditModal(s)}
								>
									Edit
								</button>
								<button
									className="btn-danger btn-sm flex-1"
									onClick={() => handleDelete(s)}
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add / Edit Modal */}
			{showModal && (
				<div className="modal-overlay" onClick={() => setShowModal(false)}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h2 className="mb-4 text-lg font-bold">
							{editingSkill ? "Edit Skill" : "Add Skill"}
						</h2>

						{!editingSkill && (
							<div className="mb-3">
								<div className="mb-2 flex gap-2">
									<button
										className={`btn-sm flex-1 ${!isNewSkill ? "" : "btn-secondary"}`}
										onClick={() => setIsNewSkill(false)}
									>
										Existing Skill
									</button>
									<button
										className={`btn-sm flex-1 ${isNewSkill ? "" : "btn-secondary"}`}
										onClick={() => setIsNewSkill(true)}
									>
										New Skill
									</button>
								</div>

								{isNewSkill ? (
									<input
										placeholder="Enter new skill name"
										value={newSkillName}
										onChange={(e) => setNewSkillName(e.target.value)}
									/>
								) : (
									<select
										value={selectedSkillId}
										onChange={(e) => setSelectedSkillId(e.target.value)}
									>
										<option value="">Select a skill...</option>
										{allSkills.map((sk) => (
											<option key={sk.skill_id} value={sk.skill_id}>
												{sk.skill_name}
											</option>
										))}
									</select>
								)}
							</div>
						)}

						<div className="mb-4">
							<label className="mb-1 block text-xs font-medium text-slate-600">
								Proficiency Level
							</label>
							<select
								value={proficiency}
								onChange={(e) => setProficiency(e.target.value)}
							>
								{PROFICIENCY_LEVELS.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
						</div>

						<div className="flex gap-2">
							<button
								className="btn-secondary flex-1"
								onClick={() => setShowModal(false)}
							>
								Cancel
							</button>
							<button className="flex-1" onClick={handleSave}>
								{editingSkill ? "Save Changes" : "Add Skill"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
