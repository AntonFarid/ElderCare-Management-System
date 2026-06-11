import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Input,
    Button,
    Chip,
    Tooltip,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Textarea
} from "@heroui/react";
import {
    Plus,
    Search,
    Flame,
    Activity,
    Cookie,
    Soup,
    Coffee,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Utensils,
    Tag,
    ChevronRight
} from "lucide-react";
import { teamLeaderApiServices } from "../../services/TeamLeader/TeamLeaderApi";
import { addToast } from "@heroui/toast";

export default function TeamLeaderRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [isRetraining, setIsRetraining] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Form states
    const [recipeName, setRecipeName] = useState("");
    const [description, setDescription] = useState("");
    const [calories, setCalories] = useState("");
    const [proteinG, setProteinG] = useState("");
    const [carbsG, setCarbsG] = useState("");
    const [fatG, setFatG] = useState("");
    const [mealType, setMealType] = useState("breakfast");
    const [tagsInput, setTagsInput] = useState("");

    const fetchRecipes = async () => {
        setIsLoading(true);
        try {
            const response = await teamLeaderApiServices.getRecipes();
            // C# response is wrapped in Response<T>
            if (response.data.succeeded) {
                setRecipes(response.data.data || []);
                setFilteredRecipes(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching recipes:", error);
            addToast({
                title: "Fetch Failed",
                description: "Could not retrieve recipes from the server.",
                color: "danger",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    // Filter recipes locally
    useEffect(() => {
        let temp = [...recipes];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            temp = temp.filter(r => 
                r.recipe_name.toLowerCase().includes(term) ||
                r.description.toLowerCase().includes(term) ||
                (r.tags && r.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        // Tab category filter
        if (activeTab !== "all") {
            temp = temp.filter(r => r.type.toLowerCase() === activeTab);
        }

        setFilteredRecipes(temp);
    }, [searchTerm, activeTab, recipes]);

    const handleRetrain = async () => {
        setIsRetraining(true);
        try {
            const response = await teamLeaderApiServices.retrainModel();
            if (response.data.succeeded) {
                addToast({
                    title: "Success",
                    description: "AI model retrained successfully with latest recipes.",
                    color: "success",
                });
            } else {
                addToast({
                    title: "Retraining Alert",
                    description: response.data.message || "Model retraining failed.",
                    color: "warning",
                });
            }
        } catch (error) {
            console.error("Error retraining model:", error);
            addToast({
                title: "Error",
                description: "Could not reach retraining server.",
                color: "danger",
            });
        } finally {
            setIsRetraining(false);
        }
    };

    const handleAddRecipeSubmit = async () => {
        // Validation
        if (!recipeName.trim() || !description.trim() || !calories || !proteinG || !carbsG || !fatG) {
            addToast({
                title: "Validation Error",
                description: "Please fill out all required fields.",
                color: "warning",
            });
            return;
        }

        setIsSaving(true);
        try {
            const tags = tagsInput
                .split(",")
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            const payload = {
                recipe_name: recipeName.trim(),
                description: description.trim(),
                calories: parseInt(calories),
                protein_g: parseInt(proteinG),
                carbs_g: parseInt(carbsG),
                fat_g: parseInt(fatG),
                type: mealType,
                tags: tags
            };

            const response = await teamLeaderApiServices.addRecipe(payload);
            if (response.data.succeeded) {
                addToast({
                    title: "Recipe Added",
                    description: "Recipe was saved and AI model retrained successfully.",
                    color: "success",
                });
                
                // Clear fields
                setRecipeName("");
                setDescription("");
                setCalories("");
                setProteinG("");
                setCarbsG("");
                setFatG("");
                setMealType("breakfast");
                setTagsInput("");
                
                onClose();
                fetchRecipes(); // Reload list
            } else {
                addToast({
                    title: "Error adding recipe",
                    description: response.data.message || "Addition failed.",
                    color: "danger",
                });
            }
        } catch (error) {
            console.error("Error creating recipe:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.message || "Failed to communicate with recipes API.",
                color: "danger",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getMealTypeIcon = (type) => {
        switch (type.toLowerCase()) {
            case "breakfast":
                return <Coffee className="w-4 h-4 text-amber-500" />;
            case "lunch":
                return <Soup className="w-4 h-4 text-emerald-500" />;
            case "dinner":
                return <Utensils className="w-4 h-4 text-indigo-500" />;
            default:
                return <Cookie className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-6 min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 mt-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Utensils className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                            Culinary Recipe Bank
                        </h1>
                    </div>
                    <p className="text-slate-500 font-normal ml-1">
                        Expose, retrain, and audit nutritional meals for AI dietary optimization.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="flat"
                        color="secondary"
                        startContent={<RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />}
                        onPress={handleRetrain}
                        isLoading={isRetraining}
                        className="font-medium bg-secondary-50 text-secondary border border-secondary-100"
                    >
                        Retrain AI Model
                    </Button>
                    <Button
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={onOpen}
                        className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    >
                        Add Custom Recipe
                    </Button>
                </div>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Utensils className="w-16 h-16" />
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Recipes</p>
                            <p className="text-2xl font-bold text-slate-900">{recipes.length}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Coffee className="w-16 h-16 text-amber-500" />
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                            <Coffee className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Breakfast Recipes</p>
                            <p className="text-2xl font-bold text-slate-900">{recipes.filter(r => r.type.toLowerCase() === "breakfast").length}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Soup className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
                            <Soup className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lunch Recipes</p>
                            <p className="text-2xl font-bold text-slate-900">{recipes.filter(r => r.type.toLowerCase() === "lunch").length}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardBody className="p-6 flex flex-row items-center gap-4 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Cookie className="w-16 h-16 text-indigo-500" />
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dinner Recipes</p>
                            <p className="text-2xl font-bold text-slate-900">{recipes.filter(r => r.type.toLowerCase() === "dinner").length}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden p-4">
                <CardBody className="p-0 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-1 md:flex-none px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "all" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            All Meals
                        </button>
                        <button
                            onClick={() => setActiveTab("breakfast")}
                            className={`flex-1 md:flex-none px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "breakfast" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Breakfast
                        </button>
                        <button
                            onClick={() => setActiveTab("lunch")}
                            className={`flex-1 md:flex-none px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "lunch" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Lunch
                        </button>
                        <button
                            onClick={() => setActiveTab("dinner")}
                            className={`flex-1 md:flex-none px-5 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === "dinner" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Dinner
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="w-full md:max-w-md relative group">
                        <Input
                            placeholder="Search by meal name, ingredient, tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startContent={<Search className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />}
                            variant="faded"
                            isClearable
                            classNames={{
                                inputWrapper: "h-11 bg-slate-50 shadow-inner rounded-xl group-hover:bg-slate-100 transition-colors"
                            }}
                            onClear={() => setSearchTerm("")}
                            size="md"
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Recipes Grid */}
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-[40vh] gap-4">
                    <Spinner size="lg" color="primary" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse uppercase tracking-[0.2em]">Exposing Recipe Bank...</p>
                </div>
            ) : filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecipes.map((recipe, index) => (
                        <Card key={index} className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col group overflow-hidden">
                            <CardHeader className="flex justify-between items-start pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-50 rounded-xl">
                                        {getMealTypeIcon(recipe.type)}
                                    </div>
                                    <Chip size="sm" variant="flat" color={recipe.type.toLowerCase() === 'breakfast' ? 'warning' : recipe.type.toLowerCase() === 'lunch' ? 'success' : 'primary'} className="uppercase font-bold text-[9px] tracking-wider">
                                        {recipe.type}
                                    </Chip>
                                </div>
                                <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                    <Flame className="w-3.5 h-3.5 fill-red-500" />
                                    <span className="text-xs font-bold">{recipe.calories} kcal</span>
                                </div>
                            </CardHeader>
                            <CardBody className="p-4 pt-1 flex-1 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg tracking-tight truncate group-hover:text-indigo-600 transition-colors" title={recipe.recipe_name}>
                                        {recipe.recipe_name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-normal line-clamp-2 h-8 leading-relaxed">
                                        {recipe.description || "A custom formulated meal optimized for senior wellness and balanced metabolic activity."}
                                    </p>
                                </div>

                                {/* Macros Breakdown */}
                                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center border border-slate-100/50">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Protein</p>
                                        <p className="text-sm font-bold text-slate-700">{recipe.protein_g}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Carbs</p>
                                        <p className="text-sm font-bold text-slate-700">{recipe.carbs_g}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fat</p>
                                        <p className="text-sm font-bold text-slate-700">{recipe.fat_g}g</p>
                                    </div>
                                </div>

                                {/* Tags */}
                                {recipe.tags && recipe.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                                        {recipe.tags.slice(0, 3).map((tag, i) => (
                                            <Chip key={i} size="sm" variant="bordered" className="text-[9px] text-slate-600 border-slate-200 capitalize font-medium py-0 h-5">
                                                {tag}
                                            </Chip>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-auto h-7" />
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center flex flex-col items-center gap-4 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 p-6 rounded-full">
                        <Utensils className="w-16 h-16 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-800">No Recipes Found</p>
                        <p className="text-sm text-slate-400 font-normal">Try broadening your search term or add a new recipe above.</p>
                    </div>
                </div>
            )}

            {/* Add Recipe Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg" className="rounded-3xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-3 border-b border-slate-100 py-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Utensils className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-slate-900">Add Custom Culinary Recipe</span>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">retrains model on successful creation</span>
                                </div>
                            </ModalHeader>
                            <ModalBody className="py-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Recipe Name"
                                        placeholder="e.g. Garlic Herb Grilled Fish"
                                        labelPlacement="outside"
                                        value={recipeName}
                                        onChange={(e) => setRecipeName(e.target.value)}
                                        isRequired
                                    />
                                    <Select
                                        label="Meal Category"
                                        labelPlacement="outside"
                                        value={mealType}
                                        onChange={(e) => setMealType(e.target.value)}
                                        isRequired
                                    >
                                        <SelectItem key="breakfast" value="breakfast">Breakfast</SelectItem>
                                        <SelectItem key="lunch" value="lunch">Lunch</SelectItem>
                                        <SelectItem key="dinner" value="dinner">Dinner</SelectItem>
                                    </Select>
                                </div>

                                <Textarea
                                    label="Recipe Description"
                                    placeholder="Write a clear dietitian-friendly summary of the recipe..."
                                    labelPlacement="outside"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    isRequired
                                    minRows={2}
                                />

                                <div className="grid grid-cols-4 gap-3">
                                    <Input
                                        type="number"
                                        label="Calories (kcal)"
                                        placeholder="350"
                                        labelPlacement="outside"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        isRequired
                                        min={0}
                                    />
                                    <Input
                                        type="number"
                                        label="Protein (g)"
                                        placeholder="20"
                                        labelPlacement="outside"
                                        value={proteinG}
                                        onChange={(e) => setProteinG(e.target.value)}
                                        isRequired
                                        min={0}
                                    />
                                    <Input
                                        type="number"
                                        label="Carbs (g)"
                                        placeholder="40"
                                        labelPlacement="outside"
                                        value={carbsG}
                                        onChange={(e) => setCarbsG(e.target.value)}
                                        isRequired
                                        min={0}
                                    />
                                    <Input
                                        type="number"
                                        label="Fat (g)"
                                        placeholder="10"
                                        labelPlacement="outside"
                                        value={fatG}
                                        onChange={(e) => setFatG(e.target.value)}
                                        isRequired
                                        min={0}
                                    />
                                </div>

                                <Input
                                    label="Dietary Tags (comma separated)"
                                    placeholder="low-sodium, soft, gluten-free, heart-healthy"
                                    labelPlacement="outside"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    startContent={<Tag className="w-4 h-4 text-slate-400" />}
                                />
                            </ModalBody>
                            <ModalFooter className="border-t border-slate-100 py-4">
                                <Button variant="flat" color="danger" onPress={onClose} isDisabled={isSaving} className="font-semibold rounded-xl">
                                    Cancel
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={handleAddRecipeSubmit} 
                                    isLoading={isSaving}
                                    className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20"
                                >
                                    {isSaving ? "Retraining Model..." : "Create & Retrain"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
